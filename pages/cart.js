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
    useToast
} from '@chakra-ui/react';
import { AddIcon, MinusIcon, DeleteIcon } from '@chakra-ui/icons';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';
import { useCart } from '../components/CartContext';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => (
    <Box
        borderWidth="1px"
        borderColor="whiteAlpha.200"
        borderRadius="lg"
        overflow="hidden"
        bg="rgba(0, 0, 0, 0.4)"
        backdropFilter="blur(8px)"
        p={4}
    >
        <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} alignItems="center">
            <Image
                src={item.image}
                alt={item.name}
                boxSize="100px"
                objectFit="cover"
                borderRadius="md"
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
                    icon={<MinusIcon />}
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    isDisabled={item.quantity <= 1}
                    variant="ghost"
                    color="white"
                    _hover={{ bg: 'whiteAlpha.200' }}
                />
                <Text color="white" fontSize="lg" fontWeight="bold" minW="40px" textAlign="center">
                    {item.quantity}
                </Text>
                <IconButton
                    icon={<AddIcon />}
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    variant="ghost"
                    color="white"
                    _hover={{ bg: 'whiteAlpha.200' }}
                />
            </HStack>
            <HStack justify="space-between" w="100%">
                <Text color="white" fontSize="lg" fontWeight="bold">
                    ${(item.price * item.quantity).toFixed(2)}
                </Text>
                <IconButton
                    icon={<DeleteIcon />}
                    onClick={() => onRemove(item.id)}
                    variant="ghost"
                    color="red.400"
                    _hover={{ bg: 'whiteAlpha.200', color: 'red.300' }}
                />
            </HStack>
        </SimpleGrid>
    </Box>
);

export default function Cart() {
    const router = useRouter();
    const toast = useToast();
    const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();

    const handleCheckout = () => {
        // Implement checkout logic
        toast({
            title: "Proceeding to checkout",
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
                            <Heading 
                                color="white" 
                                size="2xl"
                                textAlign="center"
                                bgGradient="linear(to-r, white, whiteAlpha.800)"
                                bgClip="text"
                            >
                                Shopping Cart
                            </Heading>

                            {cartItems.length === 0 ? (
                                <VStack py={12} spacing={6}>
                                    <Text color="white" fontSize="xl">
                                        Your cart is empty
                                    </Text>
                                    <Button
                                        onClick={() => router.push('/shop')}
                                        size="lg"
                                        bg="white"
                                        color="black"
                                        _hover={{
                                            transform: 'translateY(-2px)',
                                            boxShadow: 'lg',
                                            bg: 'whiteAlpha.800'
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
                                                key={item.id}
                                                item={item}
                                                onUpdateQuantity={updateQuantity}
                                                onRemove={removeFromCart}
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
                                        <HStack justify="space-between" mb={6}>
                                            <Text color="white" fontSize="xl">Total:</Text>
                                            <Text color="white" fontSize="2xl" fontWeight="bold">
                                                ${getCartTotal().toFixed(2)}
                                            </Text>
                                        </HStack>
                                        <Button
                                            w="100%"
                                            size="lg"
                                            bg="white"
                                            color="black"
                                            _hover={{
                                                transform: 'translateY(-2px)',
                                                boxShadow: 'lg',
                                                bg: 'whiteAlpha.800'
                                            }}
                                            onClick={handleCheckout}
                                        >
                                            Proceed to Checkout
                                        </Button>
                                    </Box>
                                </>
                            )}
                        </VStack>
                    </Container>
                </Box>
            </Box>
        </>
    );
} 