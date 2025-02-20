import Realm from 'realm';
import NetInfo from '@react-native-community/netinfo';

const ProductSchema = {
  name: 'Product',
  primaryKey: 'id',
  properties: {
    id: 'int',
    title: 'string',
    price: 'double',
    thumbnail: 'string',
    description: 'string',
  },
};

const FavoriteSchema = {
  name: 'Favorite',
  primaryKey: 'id',
  properties: {
    id: 'int',
    productData: 'string',
    createdAt: 'date',
  },
};

let realm;

export const initDatabase = async () => {
  try {
    realm = await Realm.open({
      schema: [ProductSchema, FavoriteSchema],
      schemaVersion: 2,
    });
    return true;
  } catch (error) {
    console.error('Failed to open realm:', error);
    return false;
  }
};

export const addFavorite = async (product) => {
  if (!realm) return false;
  
  try {
    realm.write(() => {
      realm.create('Favorite', {
        id: product.id,
        productData: JSON.stringify(product),
        createdAt: new Date(),
      }, 'modified');
    });
    return true;
  } catch (error) {
    console.error('Error adding favorite:', error);
    return false;
  }
};

export const removeFavorite = async (productId) => {
  if (!realm) return false;

  try {
    realm.write(() => {
      const favorite = realm.objectForPrimaryKey('Favorite', productId);
      if (favorite) {
        realm.delete(favorite);
      }
    });
    return true;
  } catch (error) {
    console.error('Error removing favorite:', error);
    return false;
  }
};

export const getAllFavorites = () => {
  if (!realm) return [];

  try {
    const favorites = realm
      .objects('Favorite')
      .sorted('createdAt', true);
    
    const results = Array.from(favorites).map(fav => JSON.parse(fav.productData));
    return results;
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

export const saveProducts = (products) => {
  try {
    realm.write(() => {
      products.forEach(product => {
        realm.create('Product', {
          id: product.id,
          title: product.title,
          price: product.price,
          thumbnail: product.thumbnail,
          description: product.description || '',
        }, 'modified');
      });
    });
    return true;
  } catch (error) {
    console.error('Error saving products:', error);
    return false;
  }
};

export const getOfflineProducts = (searchQuery = '') => {
  try {
    const products = realm.objects('Product');
    if (searchQuery) {
      return Array.from(products.filtered('title CONTAINS[c] $0', searchQuery));
    }
    return Array.from(products);
  } catch (error) {
    console.error('Error getting offline products:', error);
    return [];
  }
};

export const isConnected = async () => {
  const netInfo = await NetInfo.fetch();
  return netInfo.isConnected;
};

export const closeDatabase = () => {
  if (realm) {
    realm.close();
  }
};

export const subscribeToFavorites = (callback) => {
  if (!realm) return;

  const favorites = realm.objects('Favorite').sorted('createdAt', true);
  
  let timeoutId;
  
  favorites.addListener((collection) => {
    if (timeoutId) clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      const updatedFavorites = Array.from(collection).map(fav => 
        JSON.parse(fav.productData)
      );
      callback(updatedFavorites);
    }, 100);
  });

  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (favorites.isValid()) {
      favorites.removeAllListeners();
    }
  };
}; 