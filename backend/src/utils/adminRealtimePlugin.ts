import type { Schema } from 'mongoose';
import { adminChanges, AdminTopic } from '../services/adminEvents';

// Register before compiling each model. Hooks run only after a successful write,
// including changes originating outside admin controllers (registration, reports, etc.).
export function adminRealtimePlugin(
  schema: Schema,
  options: { topics: AdminTopic[] }
) {
  const notify = () => {
    adminChanges.publish(options.topics);
  };
  schema.post('save', notify);
  schema.post('insertMany', (documents) => {
    if (documents?.length) notify();
  });
  for (const operation of [
    'updateOne',
    'updateMany',
    'replaceOne',
    'deleteOne',
    'deleteMany',
  ] as const) {
    schema.post(operation, (result) => {
      if (
        result &&
        (result.modifiedCount || result.deletedCount || result.upsertedCount)
      )
        notify();
    });
  }
  for (const operation of [
    'findOneAndUpdate',
    'findOneAndReplace',
    'findOneAndDelete',
  ] as const) {
    schema.post(operation, (document) => {
      if (document) notify();
    });
  }
}
