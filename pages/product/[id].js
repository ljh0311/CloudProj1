import {
    Box,
    Container,
    SimpleGrid,
    Image,
    Heading,
    Text,
    Button,
    VStack,
    HStack,
    Badge,
    List,
    ListItem,
    ListIcon,
    useToast
} from '@chakra-ui/react';
import { MdCheckCircle } from 'react-icons/md';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';

// This would normally come from an API or database
const getProductById = (id) => {
    return sampleProducts.find(product => product.id === parseInt(id));
};

export default function ProductDetail() {
    const router = useRouter();
    const { id } = router.query;
    const toast = useToast();
    
    // Get product data
    const product = getProductById(id);

    if (!product) {
        return (
            <>
                <Navbar />
                <Box as="main" bg="black" color="white" minH="100vh">
                    <Container maxW="container.xl" py={20}>
                        <Heading>Product Not Found</Heading>
                        <Button 
                            mt={4}
                            onClick={() => router.push('/shop')}
                            bg="white"
                            color="black"
                            _hover={{ bg: 'whiteAlpha.800' }}
                        >
                            Back to Shop
                        </Button>
                    </Container>
                </Box>
            </>
        );
    }

    const handleAddToCart = () => {
        toast({
            title: "Added to Cart",
            description: `${product.name} has been added to your cart.`,
            status: "success",
            duration: 3000,
            isClosable: true,
        });
    };

    return (
        <>
            <Head>
                <title>{product.name} | KAPPY Vintage</title>
                <meta name="description" content={product.description} />
            </Head>

            <Navbar />

            <Box as="main" bg="black" color="white" minH="100vh">
                <Container maxW="container.xl" py={8}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                        {/* Product Image */}
                        <Box>
                            <Image
                                src={product.image}
                                alt={product.name}
                                width="100%"
                                height="auto"
                                objectFit="cover"
                                borderRadius="lg"
                            />
                        </Box>

                        {/* Product Details */}
                        <VStack align="start" spacing={6}>
                            <Box>
                                <Heading size="2xl" mb={2}>
                                    {product.name}
                                </Heading>
                                <HStack spacing={2} mb={4}>
                                    <Badge colorScheme="green">{product.condition}</Badge>
                                    <Badge colorScheme="purple">Size {product.size}</Badge>
                                    <Badge colorScheme="blue">{product.category}</Badge>
                                </HStack>
                                <Text fontSize="2xl" fontWeight="bold" color="white">
                                    ${product.price.toFixed(2)}
                                </Text>
                            </Box>

                            <Text color="whiteAlpha.800" fontSize="lg">
                                {product.description}
                            </Text>

                            <VStack align="start" spacing={4} width="100%">
                                <Heading size="md">Product Details</Heading>
                                <List spacing={3}>
                                    <ListItem>
                                        <ListIcon as={MdCheckCircle} color="green.500" />
                                        Material: {product.material}
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon as={MdCheckCircle} color="green.500" />
                                        Condition: {product.condition}
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon as={MdCheckCircle} color="green.500" />
                                        Size: {product.size}
                                    </ListItem>
                                </List>
                            </VStack>

                            <Box width="100%" pt={6}>
                                <Button
                                    size="lg"
                                    width="100%"
                                    bg="white"
                                    color="black"
                                    _hover={{ bg: 'whiteAlpha.800' }}
                                    onClick={handleAddToCart}
                                >
                                    Add to Cart
                                </Button>
                            </Box>
                        </VStack>
                    </SimpleGrid>
                </Container>
            </Box>
        </>
    );
}

// Sample product data - this should match the data in your shop.js
const sampleProducts = [
    {
        id: 1,
        name: "Vintage Nike Sportswear Tee",
        price: 45.99,
        category: "Graphic Tees",
        image: "https://placehold.co/400x500",
        condition: "Excellent",
        size: "M",
        description: "Classic Nike sportswear tee from the 90s featuring iconic swoosh graphic. Perfect vintage condition.",
        material: "100% Cotton"
    },
    {
        id: 2,
        name: "90s Band Tour T-Shirt",
        price: 55.00,
        category: "Band Tees",
        image: "https://placehold.co/400x500",
        condition: "Good",
        size: "L",
        description: "Authentic vintage band tour t-shirt with original graphics. Perfectly worn-in fabric.",
        material: "100% Cotton"
    },
    {
        id: 3,
        name: "Retro Gaming T-Shirt",
        price: 42.00,
        category: "Graphic Tees",
        image: "https://placehold.co/400x500",
        condition: "Very Good",
        size: "M",
        description: "Vintage gaming t-shirt featuring classic arcade graphics. Soft, comfortable fabric.",
        material: "Cotton Blend"
    },
    {
        id: 4,
        name: "Minimalist Essential Tee",
        price: 35.00,
        category: "Basic Tees",
        image: "https://placehold.co/400x500",
        condition: "Excellent",
        size: "S",
        description: "Classic vintage basic tee in a timeless cut. Perfect for everyday wear.",
        material: "100% Cotton"
    }
]; 