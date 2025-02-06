import { 
    Box, 
    Container, 
    Heading, 
    SimpleGrid, 
    Input, 
    Select, 
    HStack, 
    VStack,
    Text,
    Image,
    Button,
    Badge,
    useColorModeValue,
    Flex,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Textarea,
    useDisclosure,
    useToast,
    Spinner,
    Center
} from '@chakra-ui/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';
import { AddIcon } from '@chakra-ui/icons';

const ProductCard = ({ product }) => {
    const router = useRouter();

    return (
        <Box 
            as="article"
            borderWidth="1px" 
            borderColor="whiteAlpha.200" 
            borderRadius="lg" 
            overflow="hidden"
            transition="all 0.3s"
            _hover={{ 
                transform: 'translateY(-5px)',
                boxShadow: 'xl',
                borderColor: 'rgba(255, 255, 255, 0.4)'
            }}
            bg="rgba(0, 0, 0, 0.4)"
            backdropFilter="blur(8px)"
            onClick={() => router.push(`/product/${product.id}`)}
            cursor="pointer"
        >
            <Image
                src={product.image}
                alt={product.name}
                width="100%"
                height="auto"
                objectFit="cover"
            />
            <VStack p={4} align="start" spacing={2}>
                <Heading size="md" color="white">
                    {product.name}
                </Heading>
                <HStack spacing={2}>
                    <Badge colorScheme="green">{product.condition}</Badge>
                    <Badge colorScheme="purple">Size {product.size}</Badge>
                </HStack>
                <Text color="white" fontSize="xl" fontWeight="bold">
                    ${product.price.toFixed(2)}
                </Text>
                <Button
                    width="100%"
                    bg="white"
                    color="black"
                    _hover={{ bg: 'rgba(255, 255, 255, 0.8)' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        // Add to cart logic here
                    }}
                >
                    Add to Cart
                </Button>
            </VStack>
        </Box>
    );
};

const AddProductModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: '',
        image: '',
        condition: '',
        size: '',
        description: '',
        material: ''
    });
    const toast = useToast();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add product');
            }

            const newProduct = await response.json();
            
            toast({
                title: "Product added successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            // Reset form and close modal
            setFormData({
                name: '',
                price: '',
                category: '',
                image: '',
                condition: '',
                size: '',
                description: '',
                material: ''
            });
            onClose();

            // Optionally refresh the products list
            // You might want to add a function to fetch products and update state
        } catch (error) {
            toast({
                title: "Error adding product",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay backdropFilter="blur(10px)" />
            <ModalContent bg="black" borderWidth="1px" borderColor="whiteAlpha.200">
                <ModalHeader color="white">Add New Product</ModalHeader>
                <ModalCloseButton color="white" />
                <ModalBody>
                    <VStack spacing={4}>
                        <FormControl>
                            <FormLabel color="white">Product Name</FormLabel>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                bg="whiteAlpha.100"
                                border="none"
                                color="white"
                                _hover={{ bg: 'whiteAlpha.200' }}
                                _focus={{ bg: 'whiteAlpha.200', boxShadow: 'none' }}
                            />
                        </FormControl>
                        
                        <FormControl>
                            <FormLabel color="white">Price</FormLabel>
                            <Input
                                name="price"
                                type="number"
                                value={formData.price}
                                onChange={handleInputChange}
                                bg="whiteAlpha.100"
                                border="none"
                                color="white"
                                _hover={{ bg: 'whiteAlpha.200' }}
                                _focus={{ bg: 'whiteAlpha.200', boxShadow: 'none' }}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel color="white">Category</FormLabel>
                            <Select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                bg="whiteAlpha.100"
                                border="none"
                                color="white"
                                _hover={{ bg: 'whiteAlpha.200' }}
                                _focus={{ bg: 'whiteAlpha.200', boxShadow: 'none' }}
                            >
                                <option value="Graphic Tees">Graphic Tees</option>
                                <option value="Band Tees">Band Tees</option>
                                <option value="Basic Tees">Basic Tees</option>
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel color="white">Image URL</FormLabel>
                            <Input
                                name="image"
                                value={formData.image}
                                onChange={handleInputChange}
                                bg="whiteAlpha.100"
                                border="none"
                                color="white"
                                _hover={{ bg: 'whiteAlpha.200' }}
                                _focus={{ bg: 'whiteAlpha.200', boxShadow: 'none' }}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel color="white">Condition</FormLabel>
                            <Select
                                name="condition"
                                value={formData.condition}
                                onChange={handleInputChange}
                                bg="whiteAlpha.100"
                                border="none"
                                color="white"
                                _hover={{ bg: 'whiteAlpha.200' }}
                                _focus={{ bg: 'whiteAlpha.200', boxShadow: 'none' }}
                            >
                                <option value="Excellent">Excellent</option>
                                <option value="Very Good">Very Good</option>
                                <option value="Good">Good</option>
                                <option value="Fair">Fair</option>
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel color="white">Size</FormLabel>
                            <Select
                                name="size"
                                value={formData.size}
                                onChange={handleInputChange}
                                bg="whiteAlpha.100"
                                border="none"
                                color="white"
                                _hover={{ bg: 'whiteAlpha.200' }}
                                _focus={{ bg: 'whiteAlpha.200', boxShadow: 'none' }}
                            >
                                <option value="S">S</option>
                                <option value="M">M</option>
                                <option value="L">L</option>
                                <option value="XL">XL</option>
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel color="white">Material</FormLabel>
                            <Input
                                name="material"
                                value={formData.material}
                                onChange={handleInputChange}
                                bg="whiteAlpha.100"
                                border="none"
                                color="white"
                                _hover={{ bg: 'whiteAlpha.200' }}
                                _focus={{ bg: 'whiteAlpha.200', boxShadow: 'none' }}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel color="white">Description</FormLabel>
                            <Textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                bg="whiteAlpha.100"
                                border="none"
                                color="white"
                                _hover={{ bg: 'whiteAlpha.200' }}
                                _focus={{ bg: 'whiteAlpha.200', boxShadow: 'none' }}
                            />
                        </FormControl>
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose} color="white">
                        Cancel
                    </Button>
                    <Button colorScheme="blue" onClick={handleSubmit}>
                        Add Product
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default function Shop() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sizeFilter, setSizeFilter] = useState('');
    const [sortBy, setSortBy] = useState('');
    const { isOpen, onOpen, onClose } = useDisclosure();
    
    // TODO: Replace with actual admin check
    const isAdmin = true; // Temporary for testing

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('/api/products');
                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }
                const data = await response.json();
                setProducts(data);
            } catch (err) {
                setError('Failed to load products');
                console.error('Error loading products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    if (loading) {
        return (
            <Box position="relative" minH="100vh" bg="black">
                <Navbar />
                <Center h="calc(100vh - 60px)">
                    <Spinner size="xl" color="white" />
                </Center>
            </Box>
        );
    }

    if (error) {
        return (
            <Box position="relative" minH="100vh" bg="black">
                <Navbar />
                <Center h="calc(100vh - 60px)">
                    <Text color="white">{error}</Text>
                </Center>
            </Box>
        );
    }

    // Filter and sort products based on user selections
    const filteredProducts = products
        .filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = !categoryFilter || product.category === categoryFilter;
            const matchesSize = !sizeFilter || product.size === sizeFilter;
            return matchesSearch && matchesCategory && matchesSize;
        })
        .sort((a, b) => {
            if (sortBy === 'price-asc') return a.price - b.price;
            if (sortBy === 'price-desc') return b.price - a.price;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return 0;
        });

    return (
        <>
            <Head>
                <title>Vintage T-Shirts | KAPPY</title>
                <meta name="description" content="Shop curated vintage t-shirts at KAPPY. Find unique styles that match Singapore's climate and youth culture." />
            </Head>

            <Box position="relative" minH="100vh" bg="black" overflow="hidden">
                <AnimatedBackground />
                
                <Box position="relative" zIndex={1}>
                    <Navbar />

                    <Container maxW="container.xl" py={8}>
                        <VStack spacing={8} align="stretch">
                            {/* Header */}
                            <Box textAlign="center" mb={8}>
                                <Heading 
                                    as="h1" 
                                    size="2xl" 
                                    mb={4}
                                    bgGradient="linear(to-r, white, whiteAlpha.800)"
                                    bgClip="text"
                                >
                                    Vintage T-Shirts
                                </Heading>
                                <Text 
                                    fontSize="lg" 
                                    color="whiteAlpha.900"
                                    textShadow="0 2px 4px rgba(0,0,0,0.4)"
                                >
                                    Curated vintage tees that tell stories
                                </Text>
                            </Box>

                            {/* Admin Controls */}
                            {isAdmin && (
                                <Box>
                                    <Button
                                        leftIcon={<AddIcon />}
                                        colorScheme="blue"
                                        onClick={onOpen}
                                        mb={4}
                                    >
                                        Add New Product
                                    </Button>
                                </Box>
                            )}

                            {/* Filters and Search */}
                            <HStack 
                                spacing={4} 
                                wrap="wrap" 
                                justify="space-between"
                                bg="rgba(255, 255, 255, 0.05)"
                                backdropFilter="blur(10px)"
                                p={4}
                                borderRadius="lg"
                                borderWidth="1px"
                                borderColor="whiteAlpha.200"
                            >
                                <Input
                                    placeholder="Search t-shirts..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    maxW="300px"
                                    bg="whiteAlpha.100"
                                    border="none"
                                    color="white"
                                    _placeholder={{ color: 'whiteAlpha.600' }}
                                    _hover={{ bg: 'whiteAlpha.200' }}
                                    _focus={{ bg: 'whiteAlpha.200', boxShadow: 'none' }}
                                />
                                <HStack spacing={4}>
                                    <Select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        placeholder="Category"
                                        bg="whiteAlpha.100"
                                        border="none"
                                        color="white"
                                        _hover={{ bg: 'whiteAlpha.200' }}
                                        _focus={{ bg: 'whiteAlpha.200', boxShadow: 'none' }}
                                    >
                                        <option value="Graphic Tees">Graphic Tees</option>
                                        <option value="Band Tees">Band Tees</option>
                                        <option value="Basic Tees">Basic Tees</option>
                                    </Select>
                                    <Select
                                        value={sizeFilter}
                                        onChange={(e) => setSizeFilter(e.target.value)}
                                        placeholder="Size"
                                        bg="whiteAlpha.100"
                                        border="none"
                                        color="white"
                                        _hover={{ bg: 'whiteAlpha.200' }}
                                        _focus={{ bg: 'whiteAlpha.200', boxShadow: 'none' }}
                                    >
                                        <option value="S">S</option>
                                        <option value="M">M</option>
                                        <option value="L">L</option>
                                        <option value="XL">XL</option>
                                    </Select>
                                    <Select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        placeholder="Sort by"
                                        bg="whiteAlpha.100"
                                        border="none"
                                        color="white"
                                        _hover={{ bg: 'whiteAlpha.200' }}
                                        _focus={{ bg: 'whiteAlpha.200', boxShadow: 'none' }}
                                    >
                                        <option value="price-asc">Price: Low to High</option>
                                        <option value="price-desc">Price: High to Low</option>
                                        <option value="name">Name</option>
                                    </Select>
                                </HStack>
                            </HStack>

                            {/* Product Grid */}
                            <SimpleGrid 
                                columns={{ base: 1, sm: 2, md: 3, lg: 4 }} 
                                spacing={6}
                                py={8}
                            >
                                {filteredProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </SimpleGrid>
                        </VStack>
                    </Container>
                </Box>
            </Box>

            {/* Add Product Modal */}
            <AddProductModal isOpen={isOpen} onClose={onClose} />
        </>
    );
} 