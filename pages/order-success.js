import {
    Box,
    Container,
    VStack,
    Heading,
    Text,
    Button,
    useColorModeValue,
    Icon,
    HStack,
    Divider,
    SimpleGrid,
    Badge,
    Card,
    CardBody,
    Image
} from '@chakra-ui/react';
import { CheckCircleIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';

export default function OrderSuccess() {
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            router.push('/auth?returnUrl=/order-success');
        },
    });
    const router = useRouter();
    const [orderDetails, setOrderDetails] = useState(null);
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    useEffect(() => {
        // Check for order details in sessionStorage
        const storedOrder = sessionStorage.getItem('lastOrder');
        if (storedOrder) {
            setOrderDetails(JSON.parse(storedOrder));
            // Clear the order from sessionStorage to prevent accessing it again
            sessionStorage.removeItem('lastOrder');
        } else if (status !== 'loading') {
            // If no order details and session is loaded, redirect to orders page
            router.push('/orders');
        }
    }, [status, router]);

    if (status === 'loading' || !orderDetails) {
        return null;
    }

    const formattedDate = new Date(orderDetails.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <>
            <Head>
                <title>Order Confirmation - Kappy</title>
                <meta name="description" content="Order confirmation page" />
            </Head>

            <Box minH="100vh" position="relative">
                <AnimatedBackground />
                <Navbar />

                <Container maxW="container.lg" py={10}>
                    <Card
                        bg={bgColor}
                        borderWidth="1px"
                        borderColor={borderColor}
                        borderRadius="lg"
                        overflow="hidden"
                        boxShadow="lg"
                    >
                        <CardBody>
                            <VStack spacing={6} align="stretch">
                                <VStack spacing={3} align="center">
                                    <Icon as={CheckCircleIcon} w={16} h={16} color="green.500" />
                                    <Heading size="xl" textAlign="center">
                                        Thank You for Your Order!
                                    </Heading>
                                    <Text fontSize="lg" color="gray.500" textAlign="center">
                                        We&apos;ll send you an email with your order details and tracking information.
                                    </Text>
                                </VStack>

                                <Divider />

                                <VStack spacing={4} align="stretch">
                                    <Heading size="md">Order Details</Heading>
                                    <SimpleGrid columns={2} spacing={4}>
                                        <Box>
                                            <Text color="gray.500">Order Number</Text>
                                            <Text fontWeight="bold">{orderDetails.orderNumber}</Text>
                                        </Box>
                                        <Box>
                                            <Text color="gray.500">Order Date</Text>
                                            <Text fontWeight="bold">{formattedDate}</Text>
                                        </Box>
                                        <Box>
                                            <Text color="gray.500">Total Amount</Text>
                                            <Text fontWeight="bold">${orderDetails.total.toFixed(2)}</Text>
                                        </Box>
                                    </SimpleGrid>
                                </VStack>

                                <Divider />

                                <VStack spacing={4} align="stretch">
                                    <Heading size="md">Items Ordered</Heading>
                                    <SimpleGrid columns={1} spacing={4}>
                                        {orderDetails.items.map((item, index) => (
                                            <HStack
                                                key={`${item.product_id}-${index}`}
                                                spacing={4}
                                                p={4}
                                                borderWidth="1px"
                                                borderRadius="md"
                                                borderColor={borderColor}
                                            >
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    boxSize="100px"
                                                    objectFit="cover"
                                                    borderRadius="md"
                                                />
                                                <Box flex="1">
                                                    <Text fontWeight="bold">{item.name}</Text>
                                                    <HStack spacing={2}>
                                                        <Badge colorScheme="purple">Size: {item.size}</Badge>
                                                        <Badge colorScheme="blue">Qty: {item.quantity}</Badge>
                                                        <Badge colorScheme="green">${item.price.toFixed(2)}</Badge>
                                                    </HStack>
                                                </Box>
                                            </HStack>
                                        ))}
                                    </SimpleGrid>
                                </VStack>

                                <Divider />

                                <HStack spacing={4} justify="center">
                                    <Button
                                        leftIcon={<ArrowForwardIcon />}
                                        colorScheme="blue"
                                        onClick={() => router.push('/orders')}
                                    >
                                        View All Orders
                                    </Button>
                                    <Button
                                        rightIcon={<ArrowForwardIcon />}
                                        variant="outline"
                                        onClick={() => router.push('/')}
                                    >
                                        Continue Shopping
                                    </Button>
                                </HStack>
                            </VStack>
                        </CardBody>
                    </Card>
                </Container>
            </Box>
        </>
    );
} 