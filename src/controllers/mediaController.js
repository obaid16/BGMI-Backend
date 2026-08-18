const Media = require('../models/Media');
const { uploadToCloudinaryOrLocal } = require('../middleware/uploadMiddleware');
const logAction = require('../utils/auditLogger');

/**
 * @desc    Get filtered list of media (only published public-side, or all admin-side)
 * @route   GET /api/media
 * @access  Public
 */
const getMediaList = async (req, res, next) => {
  const { type, status, teamId, matchId } = req.query;

  try {

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

    const media = await Media.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: media });
  } catch (error) {
    next(error);
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
    if (!title || !type || !team || !player || !match) {
      return res.status(400).json({ success: false, message: 'Please provide title, type, team, player, and match context' });
    }

    let imageUrl = req.body.imageUrl || req.body.fileUrl || '';
    let thumbnailUrl = req.body.thumbnail || imageUrl || '';
    let publicId = '';

    // Handle file upload if present
    if (req.file) {
      const uploadResult = await uploadToCloudinaryOrLocal(req.file.path, 'bgmi_media');
      imageUrl = uploadResult.url;
      thumbnailUrl = uploadResult.thumbnailUrl || uploadResult.url;
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

    const media = await Media.create({
      title,
      type,
      team,
      player,
      match,
      thumbnail: thumbnailUrl,
      videoUrl: videoUrl || undefined,
      imageUrl: imageUrl,
      publicId,
      verified: false,
      status: 'Pending Review'
    });

    await logAction('Media Uploaded', null, `Media "${title}" (${type}) uploaded under review`, media._id.toString(), 'Media');

    res.status(201).json({ success: true, data: media });
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

module.exports = {
  getMediaList,
  createMedia,
  verifyMedia,
  publishMedia,
  deleteMedia
};
