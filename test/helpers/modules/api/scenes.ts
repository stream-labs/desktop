import { getApiClient } from '../../api-client';
import { SceneCollectionsService } from '../../../../app/services/api/external-api/scene-collections';

/**
 * Create an new empty collection and delete other collections via API
 * Helps to speed up some tests
 */
export async function clearCollections() {
  const api = await getApiClient();
  const sceneCollectionsService = api.getResource<SceneCollectionsService>(
    'SceneCollectionsService',
  );
  const newCollection = await sceneCollectionsService.create({ name: 'new collection' });
  const collectionsToRemove = sceneCollectionsService.collections.filter(
    col => col.id !== newCollection.id,
  );
  for (const collection of collectionsToRemove) {
    await sceneCollectionsService.delete(collection.id);
  }
}
