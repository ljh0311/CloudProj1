import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const LOCAL_STORAGE_KEY = 'kappy_cart';

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load cart items from localStorage on initial render
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedCart) {
                setCartItems(JSON.parse(savedCart));
            }
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save cart items to localStorage whenever they change
    useEffect(() => {
        try {
            if (!isLoading) {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cartItems));
            }
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
        }
    }, [cartItems, isLoading]);

    const addToCart = async (product, size) => {
        try {
            setCartItems(prevItems => {
                // Check if item already exists in cart
                const existingItem = prevItems.find(
                    item => item.product_id === product.id && item.size === size
                );

                if (existingItem) {
                    // Update quantity if item exists
                    return prevItems.map(item =>
                        item.product_id === product.id && item.size === size
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    );
                }

                // Add new item if it doesn't exist
                return [...prevItems, {
                    cartItemId: `${product.id}-${size}-${Date.now()}`,
                    product_id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    image: product.image || '/images/demoProduct.jpg',
                    size: size,
                    quantity: 1,
                    material: product.material || 'N/A'
                }];
            });
            return { success: true };
        } catch (error) {
            console.error('Error adding item to cart:', error);
            return { success: false, error: 'Failed to add item to cart' };
        }
    };

    const removeFromCart = async (cartItemId) => {
        try {
            setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== cartItemId));
            return { success: true };
        } catch (error) {
            console.error('Error removing item from cart:', error);
            return { success: false, error: 'Failed to remove item from cart' };
        }
    };

    const updateQuantity = async (cartItemId, newQuantity) => {
        try {
            if (newQuantity < 1) {
                throw new Error('Quantity cannot be less than 1');
            }

            setCartItems(prevItems =>
                prevItems.map(item =>
                    item.cartItemId === cartItemId
                        ? { ...item, quantity: newQuantity }
                        : item
                )
            );
            return { success: true };
        } catch (error) {
            console.error('Error updating quantity:', error);
            return { success: false, error: error.message };
        }
    };

    const clearCart = async () => {
        try {
            setCartItems([]);
            return { success: true };
        } catch (error) {
            console.error('Error clearing cart:', error);
            return { success: false, error: 'Failed to clear cart' };
        }
    };

    const getCartTotal = () => {
        try {
            return cartItems.reduce((total, item) => {
                const itemPrice = Number(item.price) || 0;
                const itemQuantity = Number(item.quantity) || 0;
                return total + (itemPrice * itemQuantity);
            }, 0);
        } catch (error) {
            console.error('Error calculating cart total:', error);
            return 0;
        }
    };

    const getCartCount = () => {
        try {
            return cartItems.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
        } catch (error) {
            console.error('Error calculating cart count:', error);
            return 0;
        }
    };

    const getShippingCost = () => {
        const subtotal = getCartTotal();
        return subtotal >= 100 ? 0 : 10;
    };

    const getTaxAmount = () => {
        const subtotal = getCartTotal();
        return subtotal * 0.07; // 7% tax
    };

    const getFinalTotal = () => {
        const subtotal = getCartTotal();
        const tax = getTaxAmount();
        const shipping = getShippingCost();
        return subtotal + tax + shipping;
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            isLoading,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getCartTotal,
            getCartCount,
            getShippingCost,
            getTaxAmount,
            getFinalTotal
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
} 