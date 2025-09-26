import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  gcsPath: {
    type: String,
    required: false // For backward compatibility
  }
}, { _id: false });

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: function(this: any) {
      return this.contentType !== 'routine';
    }
  },
  contentType: {
    type: String,
    required: true,
    enum: ['notice', 'assignment', 'routine', 'material']
  },
  targetSession: {
    type: String,
    required: true
  },
  targetDepartment: {
    type: String,
    required: false,
    enum: ['Survey Technology', 'Cadastral Topography And Land Information Technology', 'Geoinformatics Technology', 'All'],
    default: 'All'
  },
  routineData: {
    type: [mongoose.Schema.Types.Mixed],
    required: false,
    default: []
  },
  attachments: [attachmentSchema],
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Content = mongoose.models.Content || mongoose.model('Content', contentSchema);