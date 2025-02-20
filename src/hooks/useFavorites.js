import { useState, useEffect, useCallback, useMemo } from 'react';
import { initDatabase, addFavorite, removeFavorite, getAllFavorites, subscribeToFavorites } from '../services/database';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const favoriteIds = useMemo(() => 
    new Set(favorites.map(fav => fav.id)), 
    [favorites]
  );

  const toggleFavorite = useCallback(async (product) => {
    if (!isInitialized) return;

    try {
      const isFavorited = favoriteIds.has(product.id);
      
      if (isFavorited) {
        await removeFavorite(product.id);
      } else {
        await addFavorite(product);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [isInitialized, favoriteIds]);

  const isFavorite = useCallback((productId) => {
    return favoriteIds.has(productId);
  }, [favoriteIds]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        setIsLoading(true);
        await initDatabase();
        
        if (isMounted) {
          setIsInitialized(true);
          const storedFavorites = await getAllFavorites();
          setFavorites(storedFavorites);
        }
      } catch (error) {
        console.error('Error initializing favorites:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = subscribeToFavorites((updatedFavorites) => {
      setFavorites(updatedFavorites);
    });

    return unsubscribe;
  }, [isInitialized]);

  return { 
    favorites, 
    toggleFavorite, 
    isFavorite, 
    isLoading,
    isInitialized 
  };
}; 