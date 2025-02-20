import { useState, useEffect, useCallback } from 'react';
import { initDatabase, saveProducts, getOfflineProducts, isConnected } from '../services/database';
import NetInfo from '@react-native-community/netinfo';

const INITIAL_LIMIT = 20;  
const LOAD_MORE_LIMIT = 10; 

export const useProducts = (searchQuery = '') => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);


  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
        fetchProducts(true);
    });

    return () => unsubscribe();
  }, []);

  const fetchProducts = useCallback(async (isNewSearch = false) => {
    try {
      setLoading(true);
      setError(null);

      const hasConnection = await isConnected();
      setIsOffline(!hasConnection);

      if (!hasConnection) {
        const offlineProducts = getOfflineProducts(searchQuery);
        setProducts(offlineProducts);
        setHasMore(false);
        return;
      }

      const currentSkip = isNewSearch ? 0 : skip;
      const limit = isNewSearch ? INITIAL_LIMIT : LOAD_MORE_LIMIT;
      
      const baseUrl = searchQuery 
        ? `https://dummyjson.com/products/search?q=${searchQuery}&limit=${limit}&skip=${currentSkip}`
        : `https://dummyjson.com/products?limit=${limit}&skip=${currentSkip}`;

      const response = await fetch(baseUrl);
      const data = await response.json();

      const newProducts = isNewSearch 
        ? data.products 
        : [...products, ...data.products];

      setProducts(newProducts);
      setHasMore(currentSkip + limit < data.total);
      setSkip(currentSkip + limit);

      await saveProducts(data.products);
    } catch (err) {
      setError('Failed to fetch products');
      const offlineProducts = getOfflineProducts(searchQuery);
      setProducts(offlineProducts);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [skip, searchQuery, products]);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDatabase();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError('Failed to initialize database');
      }
    };
    initialize();
  }, []);
  useEffect(() => {
    if (!isInitialized) return;
    setProducts([]);
    setSkip(0);
    setHasMore(true);
    fetchProducts(true);
  }, [searchQuery, isInitialized]);


  return { 
    products, 
    loading, 
    error, 
    hasMore, 
    fetchProducts,
    isOffline,
    isInitialized 
  };
}; 