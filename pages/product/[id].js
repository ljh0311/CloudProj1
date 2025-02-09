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
    useToast
} from '@chakra-ui/react';
import { MdCheckCircle } from 'react-icons/md';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import AnimatedBackground from '../../components/AnimatedBackground';
import { useState } from 'react';
import { useCart } from '../../components/CartContext';
import productsData from '../../data/products.json';

export default function ProductDetail({ product }) {
    const [selectedSize, setSelectedSize] = useState('');
    const router = useRouter();
    const toast = useToast();
    const { addToCart } = useCart();

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
        addToCart(product, selectedSize);
        toast({
            title: "Added to Cart",
            description: `${product.name} (Size ${selectedSize}) has been added to your cart.`,
            status: "success",
            duration: 3000,
            isClosable: true,
        });
    };

    const getSizeAvailabilityColor = (stock) => {
        if (stock > 10) return "green";
        if (stock > 0) return "yellow";
        return "red";
    };

    return (
        <>
            <Head>
                <title>{product.name} | KAPPY Vintage</title>
                <meta name="description" content={product.description} />
            </Head>

            <Box minH="100vh" bg="black" position="relative" overflow="hidden">
                <AnimatedBackground />

                <Box position="relative" zIndex={1}>
                    <Navbar />

                    <Container maxW={'7xl'} py={12}>
                        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={10}>
                            {/* Product Image */}
                            <Flex>
                                <Image
                                    rounded={'md'}
                                    alt={product.name}
                                    src={product.image}
                                    fit={'cover'}
                                    align={'center'}
                                    w={'100%'}
                                    h={{ base: '100%', sm: '400px', lg: '500px' }}
                                />
                            </Flex>

                            {/* Product Details */}
                            <Stack spacing={6}>
                                <Box as={'header'}>
                                    <Heading
                                        color="white"
                                        lineHeight={1.1}
                                        fontWeight={600}
                                        fontSize={{ base: '2xl', sm: '4xl', lg: '5xl' }}>
                                        {product.name}
                                    </Heading>
                                    <Text
                                        color="whiteAlpha.800"
                                        fontWeight={300}
                                        fontSize={'2xl'}>
                                        ${product.price.toFixed(2)}
                                    </Text>
                                </Box>

                                <Stack
                                    spacing={4}
                                    divider={
                                        <StackDivider borderColor="whiteAlpha.200" />
                                    }>
                                    <VStack spacing={4} align="stretch">
                                        <Text color="white" fontSize={'lg'}>
                                            {product.description}
                                        </Text>

                                        {/* Size Selection and Availability */}
                                        <Box>
                                            <Text color="white" fontSize="lg" fontWeight="semibold" mb={4}>
                                                Size & Availability
                                            </Text>
                                            <StatGroup
                                                bg="rgba(0,0,0,0.3)"
                                                p={4}
                                                borderRadius="md"
                                                borderWidth="1px"
                                                borderColor="whiteAlpha.200"
                                            >
                                                <Stat>
                                                    <StatLabel color="white">Small</StatLabel>
                                                    <StatNumber color={`${getSizeAvailabilityColor(product.size_s_stock)}.400`}>
                                                        {product.size_s_stock} left
                                                    </StatNumber>
                                                </Stat>
                                                <Stat>
                                                    <StatLabel color="white">Medium</StatLabel>
                                                    <StatNumber color={`${getSizeAvailabilityColor(product.size_m_stock)}.400`}>
                                                        {product.size_m_stock} left
                                                    </StatNumber>
                                                </Stat>
                                                <Stat>
                                                    <StatLabel color="white">Large</StatLabel>
                                                    <StatNumber color={`${getSizeAvailabilityColor(product.size_l_stock)}.400`}>
                                                        {product.size_l_stock} left
                                                    </StatNumber>
                                                </Stat>
                                            </StatGroup>

                                            <RadioGroup
                                                onChange={setSelectedSize}
                                                value={selectedSize}
                                                mt={4}
                                            >
                                                <HStack spacing={4}>
                                                    {[
                                                        { label: 'S', stock: product.size_s_stock },
                                                        { label: 'M', stock: product.size_m_stock },
                                                        { label: 'L', stock: product.size_l_stock }
                                                    ].map(({ label, stock }) => (
                                                        <Tooltip
                                                            key={label}
                                                            label={stock > 0 ? `${stock} available` : 'Out of stock'}
                                                            hasArrow
                                                        >
                                                            <Box>
                                                                <Radio
                                                                    value={label}
                                                                    isDisabled={stock === 0}
                                                                    colorScheme="white"
                                                                    borderColor="whiteAlpha.400"
                                                                    _checked={{
                                                                        bg: "white",
                                                                        borderColor: "white"
                                                                    }}
                                                                >
                                                                    <Text color="white">{label}</Text>
                                                                </Radio>
                                                            </Box>
                                                        </Tooltip>
                                                    ))}
                                                </HStack>
                                            </RadioGroup>
                                        </Box>

                                        {/* Product Details List */}
                                        <List spacing={2} color="whiteAlpha.800">
                                            <ListItem>
                                                <Text as={'span'} fontWeight={'bold'} color="white">
                                                    Category:
                                                </Text>{' '}
                                                {product.category}
                                            </ListItem>
                                            <ListItem>
                                                <Text as={'span'} fontWeight={'bold'} color="white">
                                                    Material:
                                                </Text>{' '}
                                                {product.material}
                                            </ListItem>
                                        </List>
                                    </VStack>
                                </Stack>

                                <Button
                                    w={'full'}
                                    size={'lg'}
                                    bg={'white'}
                                    color={'black'}
                                    _hover={{
                                        transform: 'translateY(-2px)',
                                        boxShadow: 'lg',
                                        bg: 'whiteAlpha.800'
                                    }}
                                    isDisabled={!selectedSize}
                                    onClick={handleAddToCart}
                                >
                                    Add to Cart
                                </Button>
                            </Stack>
                        </SimpleGrid>
                    </Container>
                </Box>
            </Box>
        </>
    );
}

export async function getServerSideProps({ params }) {
    try {
        const product = productsData.products.find(p => p.id === parseInt(params.id));

        if (!product) {
            return {
                notFound: true
            };
        }

        return {
            props: {
                product
            }
        };
    } catch (error) {
        console.error('Error fetching product:', error);
        return {
            notFound: true
        };
    }
} 