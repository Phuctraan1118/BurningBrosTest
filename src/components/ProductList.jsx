import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  TextInput,
  ActivityIndicator,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Keyboard,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { useProducts } from '../hooks/useProducts';
import { useFavorites } from '../hooks/useFavorites';
import { ConnectionStatus } from './ConnectionStatus';
import debounce from 'lodash/debounce';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const SPACING = 16;
const CARD_WIDTH = (width - SPACING * 3) / 2;

export const ProductList = () => {
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const { 
    products, 
    loading, 
    error, 
    hasMore, 
    fetchProducts,
    isOffline 
  } = useProducts(searchText);
  const { toggleFavorite, isFavorite } = useFavorites();

  const searchBarAnimation = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  const searchBarOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const debouncedSearch = useCallback(
    debounce((text) => {
      setIsSearching(false);
    }, 500),
    []
  );

  const handleSearchChange = (text) => {
    setSearchText(text);
    setIsSearching(true);
    debouncedSearch(text);
  };

  const handleClearSearch = () => {
    setSearchText('');
    setIsSearching(false);
    searchInputRef.current?.clear();
    Keyboard.dismiss();
  };

  useEffect(() => {
    if(error) {
      fetchProducts(true);
    }
  }, [error]);

  const renderSearchBar = () => (
    <Animated.View 
      style={[
        styles.searchContainer,
        {
          transform: [{ translateY: searchBarAnimation }],
          opacity: searchBarOpacity,
        }
      ]}
    >
      <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
      <TextInput
        ref={searchInputRef}
        style={styles.searchInput}
        placeholder="Discover amazing products..."
        placeholderTextColor="#999"
        value={searchText}
        onChangeText={handleSearchChange}
        returnKeyType="search"
        clearButtonMode="while-editing"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {searchText && (
        <TouchableOpacity 
          onPress={handleClearSearch} 
          style={styles.clearButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="close" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  const renderItem = ({ item, index }) => (
    <Animated.View
      style={[
        styles.productCard,
        {
          transform: [
            {
              scale: scrollY.interpolate({
                inputRange: [-50, 0, (index * CARD_WIDTH) / 2, (index + 2) * CARD_WIDTH],
                outputRange: [1, 1, 1, 0.95],
                extrapolate: 'clamp',
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.cardTouchable}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: item.thumbnail }} 
            style={styles.productImage}
            resizeMode="cover"
          />
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>20% OFF</Text>
          </View>
        </View>
        <View style={styles.productInfo}>
          <Text numberOfLines={2} style={styles.productTitle}>
            {item.title}
          </Text>
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>${item.price}</Text>
            <Text style={styles.originalPrice}>${(item.price * 1.2).toFixed(2)}</Text>
          </View>
          <View style={styles.ratingContainer}>
            <MaterialIcons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>4.5 (245)</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => toggleFavorite(item)}
          style={[
            styles.favoriteButton,
            isFavorite(item.id) && styles.favoritedButton,
          ]}
        >
          <MaterialIcons 
            name={isFavorite(item.id) ? 'favorite' : 'favorite-border'} 
            size={24} 
            color={isFavorite(item.id) ? '#FF4081' : '#ffffff'} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderFooter = () => {
    if (loading) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="large" color="#6200EE" />
        </View>
      );
    }

    if (!hasMore && products.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <MaterialIcons name="local-fire-department" size={24} color="#6200EE" />
          <Text style={styles.endListText}>That's all for now!</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ConnectionStatus isOffline={isOffline} />
      
      {renderSearchBar()}
      
      {error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#FF5252" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            onPress={() => fetchProducts(true)}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.FlatList
          contentContainerStyle={styles.listContainer}
          data={products}
          renderItem={renderItem}
          keyExtractor={item => `product-${item.id}`}
          numColumns={2}
          onEndReached={() => hasMore && fetchProducts()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="search-off" size={64} color="#6200EE" />
                <Text style={styles.emptyTitle}>
                  {searchText ? 'No Results Found' : 'Start Exploring'}
                </Text>
                <Text style={styles.emptyText}>
                  {searchText 
                    ? 'Try different keywords or browse our categories'
                    : 'Search for products you love'}
                </Text>
              </View>
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={loading && products.length === 0}
              onRefresh={() => fetchProducts(true)}
              colors={['#6200EE']}
              tintColor="#6200EE"
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 40,
    marginBottom: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 50,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
    fontWeight: '500',
  },
  clearButton: {
    padding: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  listContainer: {
    padding: SPACING / 2,
    paddingBottom: SPACING * 2,
  },
  cardTouchable: {
    flex: 1,
  },
  productCard: {
    width: CARD_WIDTH,
    marginHorizontal: SPACING / 2,
    marginBottom: SPACING,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: CARD_WIDTH * 1.2,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF4081',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6200EE',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  favoritedButton: {
    backgroundColor: '#fff',
  },
  footerContainer: {
    padding: SPACING,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  endListText: {
    fontSize: 14,
    color: '#6200EE',
    marginLeft: 8,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING * 2,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#6200EE',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING * 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});