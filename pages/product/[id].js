import {
    Box,
    Container,
    Stack,
    Text,
    Image,
    Flex,
    VStack,
    Button,
    Heading,
    SimpleGrid,
    StackDivider,
    List,
    ListItem,
    Badge,
    RadioGroup,
    Radio,
    HStack,
    Tooltip,
    Stat,
    StatLabel,
    StatNumber,
    StatGroup,
    useToast,
    Spinner
} from '@chakra-ui/react';
import { MdCheckCircle } from 'react-icons/md';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import AnimatedBackground from '../../components/AnimatedBackground';
import { useState, useEffect } from 'react';
import { useCart } from '../../components/CartContext';

export default function ProductDetail() {
    const router = useRouter();
    const { id } = router.query;
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addToCart } = useCart();
    const toast = useToast();

    useEffect(() => {
        if (!id) return;

        const fetchProduct = async () => {
            try {
                const response = await fetch(`/api/products?id=${id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch product');
                }
                const data = await response.json();
                setProduct(data);
                setError(null);
            } catch (error) {
                console.error('Error fetching product:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const handleAddToCart = (size) => {
        if (!product[`size_${size.toLowerCase()}_stock`]) {
            toast({
                title: "Size not available",
                description: `${product.name} is not available in size ${size}`,
                status: "error",
                duration: 2000,
                isClosable: true,
            });
            return;
        }

        addToCart(product, size);
        toast({
            title: "Added to cart",
            description: `${product.name} (Size ${size}) added to your cart`,
            status: "success",
            duration: 2000,
            isClosable: true,
        });
    };

    if (loading) {
        return (
            <Box position="relative" minH="100vh" bg="black">
                <Navbar />
                <Container centerContent py={20}>
                    <Spinner size="xl" color="white" />
                </Container>
            </Box>
        );
    }

    if (error || !product) {
        return (
            <Box position="relative" minH="100vh" bg="black">
                <Navbar />
                <Container centerContent py={20}>
                    <Text color="white">Error loading product: {error || 'Product not found'}</Text>
                </Container>
            </Box>
        );
    }

    const getSizeAvailabilityColor = (stock) => {
        if (!stock && stock !== 0) return "gray";
        if (stock > 10) return "green";
        if (stock > 0) return "yellow";
        return "red";
    };

    return (
        <>
            <Head>
                <title>{product.name} | KAPPY</title>
                <meta name="description" content={product.description} />
            </Head>

            <Box position="relative" minH="100vh" bg="black">
                <AnimatedBackground />
                
                <Box position="relative" zIndex={1}>
                    <Navbar />

                    <Container maxW="container.xl" py={8}>
                        <Box
                            bg="rgba(0, 0, 0, 0.4)"
                            backdropFilter="blur(8px)"
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor="whiteAlpha.200"
                            p={8}
                        >
                            <HStack spacing={8} align="start">
                                {/* Product Image */}
                                <Box flex="1">
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        borderRadius="lg"
                                        w="100%"
                                        h="auto"
                                        objectFit="cover"
                                    />
                                </Box>

                                {/* Product Details */}
                                <VStack flex="1" align="start" spacing={6}>
                                    <Heading 
                                        color="white"
                                        size="xl"
                                        bgGradient="linear(to-r, white, whiteAlpha.800)"
                                        bgClip="text"
                                    >
                                        {product.name}
                                    </Heading>

                                    <Text color="white" fontSize="2xl" fontWeight="bold">
                                        ${product.price.toFixed(2)}
                                    </Text>

                                    <Text color="whiteAlpha.800">
                                        Material: {product.material}
                                    </Text>

                                    <Text color="whiteAlpha.800">
                                        {product.description}
                                    </Text>

                                    <Box>
                                        <Text color="white" mb={2}>Available Sizes:</Text>
                                        <HStack spacing={4}>
                                            {['S', 'M', 'L'].map(size => (
                                                <Button
                                                    key={size}
                                                    onClick={() => handleAddToCart(size)}
                                                    isDisabled={!product[`size_${size.toLowerCase()}_stock`]}
                                                    colorScheme="blue"
                                                    variant="outline"
                                                >
                                                    {size}
                                                </Button>
                                            ))}
                                        </HStack>
                                    </Box>

                                    <Box>
                                        <Text color="white" mb={2}>Stock Availability:</Text>
                                        <VStack align="start" spacing={1}>
                                            <Text color="whiteAlpha.800">
                                                Small: {product.size_s_stock} available
                                            </Text>
                                            <Text color="whiteAlpha.800">
                                                Medium: {product.size_m_stock} available
                                            </Text>
                                            <Text color="whiteAlpha.800">
                                                Large: {product.size_l_stock} available
                                            </Text>
                                        </VStack>
                                    </Box>
                                </VStack>
                            </HStack>
                        </Box>
                    </Container>
                </Box>
            </Box>
        </>
    );
} 