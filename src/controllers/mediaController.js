const mongoose = require('mongoose');
const Media = require('../models/Media');
const { uploadToCloudinaryOrLocal } = require('../middleware/uploadMiddleware');
const logAction = require('../utils/auditLogger');

// In-memory fallback if MongoDB connection is offline
const inMemoryMedia = [];

/**
 * @desc    Get filtered list of media (only published public-side, or all admin-side)
 * @route   GET /api/media
 * @access  Public
 */
const getMediaList = async (req, res, next) => {
  const { type, status, teamId, matchId } = req.query;

  try {
    if (mongoose.connection.readyState !== 1) {
      let filtered = [...inMemoryMedia];
      if (type && type !== 'All') filtered = filtered.filter(m => m.type === type);
      if (status && status !== 'All') {
        filtered = filtered.filter(m => m.status === status);
      } else if (!status) {
        filtered = filtered.filter(m => m.status === 'Published');
      }
      return res.status(200).json({ success: true, data: filtered });
    }

    const query = {};
    
    if (type && type !== 'All') {
      query.type = type;
    }
    
    // Public default filter is Published. Admins viewing 'All' get everything.
    if (status && status !== 'All') {
      query.status = status;
    } else if (!status) {
      query.status = 'Published';
    }

    if (teamId) query.teamId = teamId;
    if (matchId) query.matchId = matchId;

    const media = await Media.find(query).sort({ createdAt: -1 }).lean();
    const formatted = media.map(m => ({ ...m, id: m._id.toString() }));
    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    // If DB fails, return in-memory items
    let filtered = [...inMemoryMedia];
    if (type && type !== 'All') filtered = filtered.filter(m => m.type === type);
    res.status(200).json({ success: true, data: filtered });
  }
};


/**
 * @desc    Upload new POV recording or screenshot (public or admin)
 * @route   POST /api/media
 * @access  Public
 */
const createMedia = async (req, res, next) => {
  const { title, type, team, player, match, videoUrl } = req.body;

  try {
    if (!type || !team || !player || !match) {
      return res.status(400).json({ success: false, message: 'Please provide type, team, player, and match context' });
    }

    const finalTitle = (title && String(title).trim()) 
      ? String(title).trim() 
      : `${team} - ${player} (${type === 'POV' ? 'POV' : 'Screenshot'}) - ${match}`;

    // Resolve uploaded file from req.file or req.files
    const uploadedFile = req.file || (req.files && (req.files.find(f => f.fieldname === 'file' || f.fieldname === 'mediaFile') || req.files[0]));

    let imageUrl = req.body.imageUrl || req.body.fileUrl || '';
    let thumbnailUrl = req.body.thumbnail || imageUrl || '';
    let resolvedVideoUrl = videoUrl || '';
    let publicId = '';

    // Handle file upload if present
    if (uploadedFile) {
      const isVideo = uploadedFile.mimetype?.startsWith('video/') || /\.(mp4|webm|mkv|mov)$/i.test(uploadedFile.originalname);
      const uploadResult = await uploadToCloudinaryOrLocal(uploadedFile.path, 'bgmi_media');
      
      if (isVideo || type === 'POV') {
        resolvedVideoUrl = uploadResult.url;
        thumbnailUrl = uploadResult.thumbnailUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80';
        imageUrl = uploadResult.url;
      } else {
        imageUrl = uploadResult.url;
        thumbnailUrl = uploadResult.thumbnailUrl || uploadResult.url;
      }
      publicId = uploadResult.publicId;
    }

    // Fallback only if no file, imageUrl, or thumbnail was provided at all
    if (!thumbnailUrl && !imageUrl) {
      thumbnailUrl = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80';
      imageUrl = thumbnailUrl;
    } else if (!thumbnailUrl) {
      thumbnailUrl = imageUrl;
    } else if (!imageUrl) {
      imageUrl = thumbnailUrl;
    }

    // If MongoDB is disconnected, store in-memory so app continues functioning seamlessly
    if (mongoose.connection.readyState !== 1) {
      const mediaItem = {
        _id: new mongoose.Types.ObjectId().toString(),
        id: new mongoose.Types.ObjectId().toString(),
        title: finalTitle,
        type,
        team,
        player,
        match,
        thumbnail: thumbnailUrl,
        videoUrl: resolvedVideoUrl || undefined,
        imageUrl: imageUrl,
        publicId,
        verified: false,
        status: 'Pending Review',
        createdAt: new Date().toISOString()
      };
      inMemoryMedia.unshift(mediaItem);
      return res.status(201).json({ success: true, data: mediaItem });
    }

    try {
      const media = await Media.create({
        title: finalTitle,
        type,
        team,
        player,
        match,
        thumbnail: thumbnailUrl,
        videoUrl: resolvedVideoUrl || undefined,
        imageUrl: imageUrl,
        publicId,
        verified: false,
        status: 'Pending Review'
      });

      await logAction('Media Uploaded', null, `Media "${finalTitle}" (${type}) uploaded under review`, media._id.toString(), 'Media');

      return res.status(201).json({ success: true, data: media });
    } catch (dbErr) {
      console.warn('[DB NOTICE] Failed to insert media in MongoDB, falling back to memory:', dbErr.message);
      const mediaItem = {
        _id: new mongoose.Types.ObjectId().toString(),
        id: new mongoose.Types.ObjectId().toString(),
        title: finalTitle,
        type,
        team,
        player,
        match,
        thumbnail: thumbnailUrl,
        videoUrl: resolvedVideoUrl || undefined,
        imageUrl: imageUrl,
        publicId,
        verified: false,
        status: 'Pending Review',
        createdAt: new Date().toISOString()
      };
      inMemoryMedia.unshift(mediaItem);
      return res.status(201).json({ success: true, data: mediaItem });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify or reject media
 * @route   PUT /api/media/:id/verify
 * @access  Private (Admin only)
 */
const verifyMedia = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body; // 'Verified', 'Rejected'

  try {
    const media = await Media.findById(id);
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media item not found' });
    }

    media.status = status;
    media.verified = status === 'Verified' || status === 'Published' || status === 'Approved';
    await media.save();

    await logAction(`Media Verification: ${status}`, req.user, `Media "${media.title}" status set to ${status}`, id, 'Media');

    res.status(200).json({ success: true, message: `Media status set to ${status}`, data: media });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Publish media to public gallery
 * @route   PUT /api/media/:id/publish
 * @access  Private (Admin only)
 */
const publishMedia = async (req, res, next) => {
  const { id } = req.params;

  try {
    const media = await Media.findById(id);
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media item not found' });
    }

    media.status = 'Published';
    media.verified = true;
    await media.save();

    await logAction('Media Published', req.user, `Media "${media.title}" published live`, id, 'Media');

    res.status(200).json({ success: true, message: 'Media published successfully', data: media });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete media
 * @route   DELETE /api/media/:id
 * @access  Private (Admin only)
 */
const deleteMedia = async (req, res, next) => {
  const { id } = req.params;

  try {
    const media = await Media.findByIdAndDelete(id);
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media item not found' });
    }

    await logAction('Media Deleted', req.user, `Media "${media.title}" deleted`, id, 'Media');

    res.status(200).json({ success: true, message: 'Media deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk delete media items
 * @route   POST /api/media/bulk-delete
 * @access  Private (Admin only)
 */
const bulkDeleteMedia = async (req, res, next) => {
  const { ids } = req.body;

  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of media IDs to delete' });
    }

    const result = await Media.deleteMany({ _id: { $in: ids } });

    await logAction('Bulk Media Deleted', req.user, `Bulk deleted ${result.deletedCount} media items`, '', 'Media');

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} media item(s)`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMediaList,
  createMedia,
  verifyMedia,
  publishMedia,
  deleteMedia,
  bulkDeleteMedia
};
