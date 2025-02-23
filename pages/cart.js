import {
    Box,
    Container,
    Heading,
    VStack,
    HStack,
    Text,
    Button,
    Image,
    SimpleGrid,
    Divider,
    IconButton,
    Badge,
    useToast,
    Skeleton,
    Alert,
    AlertIcon,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from '@chakra-ui/react';
import { AddIcon, MinusIcon, DeleteIcon } from '@chakra-ui/icons';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';
import { useCart } from '../components/CartContext';

const CartItem = ({ item, onUpdateQuantity, onRemove, isUpdating }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Box
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            borderRadius="lg"
            overflow="hidden"
            bg="rgba(0, 0, 0, 0.4)"
            backdropFilter="blur(8px)"
            p={4}
            transition="transform 0.2s"
            transform={isHovered ? 'translateY(-2px)' : 'none'}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            position="relative"
        >
            <Skeleton isLoaded={!isUpdating}>
                <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} alignItems="center">
                    <Image
                        src={item.image}
                        alt={item.name}
                        boxSize="100px"
                        objectFit="cover"
                        borderRadius="md"
                        fallbackSrc="/placeholder-image.jpg"
                    />
                    <VStack align="start">
                        <Text color="white" fontSize="lg" fontWeight="bold">
                            {item.name}
                        </Text>
                        <HStack>
                            <Badge colorScheme="purple">Size {item.size}</Badge>
                            <Badge colorScheme="blue">{item.material}</Badge>
                        </HStack>
                    </VStack>
                    <HStack>
                        <IconButton
                            aria-label="Decrease quantity"
                            icon={<MinusIcon />}
                            onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                            isDisabled={item.quantity <= 1 || isUpdating}
                            colorScheme="blue"
                            variant="ghost"
                            color="white"
                            _hover={{ bg: 'whiteAlpha.200' }}
                            _active={{ bg: 'whiteAlpha.300' }}
                        />
                        <Text color="white" fontSize="lg" fontWeight="bold" minW="40px" textAlign="center">
                            {item.quantity}
                        </Text>
                        <IconButton
                            aria-label="Increase quantity"
                            icon={<AddIcon />}
                            onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                            isDisabled={isUpdating}
                            colorScheme="blue"
                            variant="ghost"
                            color="white"
                            _hover={{ bg: 'whiteAlpha.200' }}
                            _active={{ bg: 'whiteAlpha.300' }}
                        />
                    </HStack>
                    <HStack justify="space-between" w="100%">
                        <Text color="white" fontSize="lg" fontWeight="bold">
                            ${(item.price * item.quantity).toFixed(2)}
                        </Text>
                        <IconButton
                            aria-label="Remove item"
                            icon={<DeleteIcon />}
                            onClick={() => onRemove(item.cartItemId)}
                            isDisabled={isUpdating}
                            colorScheme="red"
                            variant="ghost"
                            _hover={{ bg: 'whiteAlpha.200' }}
                            _active={{ bg: 'whiteAlpha.300' }}
                        />
                    </HStack>
                </SimpleGrid>
            </Skeleton>
        </Box>
    );
};

export default function Cart() {
    const router = useRouter();
    const toast = useToast();
    const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [itemToRemove, setItemToRemove] = useState(null);

    const handleUpdateQuantity = async (cartItemId, newQuantity) => {
        try {
            setIsUpdating(true);
            await updateQuantity(cartItemId, newQuantity);
            toast({
                title: "Cart updated",
                status: "success",
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            setError("Failed to update quantity. Please try again.");
            toast({
                title: "Error",
                description: "Failed to update quantity",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemoveItem = (cartItemId) => {
        setItemToRemove(cartItemId);
        onOpen();
    };

    const confirmRemove = async () => {
        try {
            setIsUpdating(true);
            await removeFromCart(itemToRemove);
            toast({
                title: "Item removed",
                status: "success",
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            setError("Failed to remove item. Please try again.");
            toast({
                title: "Error",
                description: "Failed to remove item",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsUpdating(false);
            onClose();
            setItemToRemove(null);
        }
    };

    const handleCheckout = () => {
        if (cartItems.length === 0) {
            toast({
                title: "Cart is empty",
                description: "Please add items to your cart before checking out.",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        router.push('/checkout');
    };

    const handleClearCart = () => {
        clearCart();
        toast({
            title: "Cart cleared",
            status: "info",
            duration: 2000,
            isClosable: true,
        });
    };

    return (
        <>
            <Head>
                <title>Shopping Cart | KAPPY</title>
                <meta name="description" content="Your shopping cart at KAPPY Vintage Streetwear" />
            </Head>

            <Box position="relative" minH="100vh" bg="black" overflow="hidden">
                <AnimatedBackground />
                
                <Box position="relative" zIndex={1}>
                    <Navbar />

                    <Container maxW="container.xl" py={12}>
                        <VStack spacing={8} align="stretch">
                            <HStack justify="space-between" align="center">
                                <Heading 
                                    color="white" 
                                    size="2xl"
                                    bgGradient="linear(to-r, white, whiteAlpha.800)"
                                    bgClip="text"
                                >
                                    Shopping Cart
                                </Heading>
                                {cartItems.length > 0 && (
                                    <Button
                                        colorScheme="red"
                                        variant="ghost"
                                        onClick={handleClearCart}
                                        isDisabled={isUpdating}
                                    >
                                        Clear Cart
                                    </Button>
                                )}
                            </HStack>

                            {error && (
                                <Alert status="error" borderRadius="md">
                                    <AlertIcon />
                                    {error}
                                </Alert>
                            )}

                            {cartItems.length === 0 ? (
                                <VStack py={12} spacing={6}>
                                    <Text color="white" fontSize="xl">
                                        Your cart is empty
                                    </Text>
                                    <Button
                                        onClick={() => router.push('/shop')}
                                        size="lg"
                                        colorScheme="blue"
                                        _hover={{
                                            transform: 'translateY(-2px)',
                                            boxShadow: 'lg',
                                        }}
                                    >
                                        Continue Shopping
                                    </Button>
                                </VStack>
                            ) : (
                                <>
                                    <VStack spacing={4}>
                                        {cartItems.map(item => (
                                            <CartItem
                                                key={item.cartItemId}
                                                item={item}
                                                onUpdateQuantity={handleUpdateQuantity}
                                                onRemove={handleRemoveItem}
                                                isUpdating={isUpdating}
                                            />
                                        ))}
                                    </VStack>

                                    <Divider borderColor="whiteAlpha.200" />

                                    <Box
                                        borderWidth="1px"
                                        borderColor="whiteAlpha.200"
                                        borderRadius="lg"
                                        p={6}
                                        bg="rgba(0, 0, 0, 0.4)"
                                        backdropFilter="blur(8px)"
                                    >
                                        <VStack spacing={4}>
                                            <HStack justify="space-between" w="100%">
                                                <Text color="white" fontSize="xl">Subtotal:</Text>
                                                <Text color="white" fontSize="xl">
                                                    ${getCartTotal().toFixed(2)}
                                                </Text>
                                            </HStack>
                                            <HStack justify="space-between" w="100%">
                                                <Text color="white" fontSize="xl">Estimated Tax (7%):</Text>
                                                <Text color="white" fontSize="xl">
                                                    ${(getCartTotal() * 0.07).toFixed(2)}
                                                </Text>
                                            </HStack>
                                            <HStack justify="space-between" w="100%">
                                                <Text color="white" fontSize="xl">Shipping:</Text>
                                                <Text color="white" fontSize="xl">
                                                    {getCartTotal() > 100 ? 'FREE' : '$10.00'}
                                                </Text>
                                            </HStack>
                                            <Divider borderColor="whiteAlpha.200" />
                                            <HStack justify="space-between" w="100%">
                                                <Text color="white" fontSize="2xl" fontWeight="bold">Total:</Text>
                                                <Text color="white" fontSize="2xl" fontWeight="bold">
                                                    ${(getCartTotal() * 1.07 + (getCartTotal() > 100 ? 0 : 10)).toFixed(2)}
                                                </Text>
                                            </HStack>
                                        </VStack>

                                        <Button
                                            w="100%"
                                            size="lg"
                                            colorScheme="blue"
                                            mt={6}
                                            _hover={{
                                                transform: 'translateY(-2px)',
                                                boxShadow: 'lg',
                                            }}
                                            onClick={handleCheckout}
                                            isDisabled={isUpdating}
                                        >
                                            Proceed to Checkout
                                        </Button>

                                        <Text color="whiteAlpha.600" fontSize="sm" textAlign="center" mt={4}>
                                            Free shipping on orders over $100
                                        </Text>
                                    </Box>
                                </>
                            )}
                        </VStack>
                    </Container>
                </Box>
            </Box>

            {/* Confirmation Modal */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay backdropFilter="blur(10px)" />
                <ModalContent bg="gray.800" color="white">
                    <ModalHeader>Remove Item</ModalHeader>
                    <ModalBody>
                        Are you sure you want to remove this item from your cart?
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button colorScheme="red" onClick={confirmRemove}>
                            Remove
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
} 