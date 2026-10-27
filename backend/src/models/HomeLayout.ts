import mongoose, { Schema } from 'mongoose';
import { adminRealtimePlugin } from '../utils/adminRealtimePlugin';
import type { SectionSettings } from '../utils/homeSections';

interface IHomeLayout { _id: string; revision: number; sections: SectionSettings[] }
const sectionSchema = new Schema({
  id: { type: String, required: true }, enabled: { type: Boolean, default: true }, order: { type: Number, required: true },
  hiddenIds: [String], pinnedIds: [String], itemOrder: [String],
  savedItems: [{ _id: false, key: String, snapshot: Schema.Types.Mixed }],
}, { _id: false });
const schema = new Schema<IHomeLayout>({
  _id: { type: String, default: 'home' }, revision: { type: Number, required: true, default: 0 }, sections: [sectionSchema],
}, { timestamps: true });
schema.plugin(adminRealtimePlugin, { topics: ['home-layout', 'dashboard'] });

export default mongoose.model<IHomeLayout>('HomeLayout', schema);
