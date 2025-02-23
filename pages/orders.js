import {
    Box,
    Container,
    VStack,
    Heading,
    Text,
    SimpleGrid,
    Card,
    CardBody,
    Badge,
    HStack,
    Divider,
    Image,
    Stack,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Button,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Spinner,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';
import { formatDate } from '../utils/dateFormatter';

const OrderCard = ({ order }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

    return (
        <>
            <Card
                bg="rgba(0, 0, 0, 0.6)"
                backdropFilter="blur(10px)"
                borderWidth="1px"
                borderColor="whiteAlpha.200"
                transition="all 0.2s"
                _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                    borderColor: 'whiteAlpha.400'
                }}
                onClick={onOpen}
                cursor="pointer"
            >
                <CardBody>
                    <VStack spacing={4} align="stretch">
                        <HStack justify="space-between">
                            <Text color="white" fontSize="sm">
                                {order.orderNumber}
                            </Text>
                            <Badge
                                colorScheme={
                                    order.status === 'delivered' ? 'green' :
                                    order.status === 'processing' ? 'yellow' :
                                    order.status === 'shipped' ? 'blue' :
                                    order.status === 'cancelled' ? 'red' :
                                    'gray'
                                }
                            >
                                {order.status}
                            </Badge>
                        </HStack>
                        <Divider borderColor="whiteAlpha.200" />
                        <HStack justify="space-between">
                            <Text color="whiteAlpha.800" fontSize="sm">
                                {formatDate(order.createdAt)}
                            </Text>
                            <Text color="white" fontWeight="bold">
                                ${Number(order.total).toFixed(2)}
                            </Text>
                        </HStack>
                        <Text color="whiteAlpha.800" fontSize="sm">
                            {items.length} item{items.length !== 1 ? 's' : ''}
                        </Text>
                    </VStack>
                </CardBody>
            </Card>

            {/* Order Details Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay backdropFilter="blur(10px)" />
                <ModalContent bg="gray.900" color="white">
                    <ModalHeader>Order Details #{order.orderNumber}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={6} align="stretch">
                            <HStack justify="space-between">
                                <Badge
                                    colorScheme={
                                        order.status === 'delivered' ? 'green' :
                                        order.status === 'processing' ? 'yellow' :
                                        order.status === 'shipped' ? 'blue' :
                                        order.status === 'cancelled' ? 'red' :
                                        'gray'
                                    }
                                    px={2}
                                    py={1}
                                    borderRadius="full"
                                >
                                    {order.status}
                                </Badge>
                                <Text fontSize="sm">
                                    {formatDate(order.createdAt)}
                                </Text>
                            </HStack>

                            <Table variant="simple" size="sm">
                                <Thead>
                                    <Tr>
                                        <Th color="whiteAlpha.600">Product</Th>
                                        <Th color="whiteAlpha.600">Size</Th>
                                        <Th color="whiteAlpha.600" isNumeric>Quantity</Th>
                                        <Th color="whiteAlpha.600" isNumeric>Price</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {items.map((item, index) => (
                                        <Tr key={index}>
                                            <Td>
                                                <HStack>
                                                    {item.image && (
                                                        <Image
                                                            src={item.image}
                                                            alt={item.name || `Product ${item.id}`}
                                                            boxSize="40px"
                                                            objectFit="cover"
                                                            borderRadius="md"
                                                        />
                                                    )}
                                                    <Text>{item.name || `Product ${item.id}`}</Text>
                                                </HStack>
                                            </Td>
                                            <Td>{item.size}</Td>
                                            <Td isNumeric>{item.quantity}</Td>
                                            <Td isNumeric>${Number(item.price).toFixed(2)}</Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>

                            <Divider borderColor="whiteAlpha.200" />

                            <SimpleGrid columns={2} spacing={4}>
                                <Box>
                                    <Text color="whiteAlpha.600">Subtotal:</Text>
                                    <Text>${Number(order.subtotal).toFixed(2)}</Text>
                                </Box>
                                <Box>
                                    <Text color="whiteAlpha.600">Tax:</Text>
                                    <Text>${Number(order.tax).toFixed(2)}</Text>
                                </Box>
                                <Box>
                                    <Text color="whiteAlpha.600">Shipping:</Text>
                                    <Text>${Number(order.shipping).toFixed(2)}</Text>
                                </Box>
                                <Box>
                                    <Text color="whiteAlpha.600" fontWeight="bold">Total:</Text>
                                    <Text fontWeight="bold">${Number(order.total).toFixed(2)}</Text>
                                </Box>
                            </SimpleGrid>

                            {order.status === 'pending' && (
                                <Button colorScheme="red" variant="outline">
                                    Cancel Order
                                </Button>
                            )}
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};

export default function Orders() {
    const { data: session } = useSession();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch('/api/orders/get-user-orders');
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch orders');
                }
                
                setOrders(data.orders || []);
            } catch (error) {
                console.error('Error fetching orders:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (session) {
            fetchOrders();
        }
    }, [session]);

    if (!session) {
        return null; // Protected by middleware
    }

    if (loading) {
        return (
            <Box position="relative" minH="100vh" bg="black">
                <AnimatedBackground />
                <Box position="relative" zIndex={1}>
                    <Navbar />
                    <Container maxW="container.xl" py={12}>
                        <VStack spacing={8}>
                            <Heading
                                color="white"
                                size="xl"
                                bgGradient="linear(to-r, white, whiteAlpha.800)"
                                bgClip="text"
                            >
                                My Orders
                            </Heading>
                            <Spinner size="xl" color="blue.500" />
                        </VStack>
                    </Container>
                </Box>
            </Box>
        );
    }

    return (
        <>
            <Head>
                <title>My Orders | KAPPY</title>
                <meta name="description" content="View your order history and track current orders" />
            </Head>

            <Box position="relative" minH="100vh" bg="black" overflow="hidden">
                <AnimatedBackground />
                
                <Box position="relative" zIndex={1}>
                    <Navbar />

                    <Container maxW="container.xl" py={12}>
                        <VStack spacing={8} align="stretch">
                            <Stack
                                direction={{ base: 'column', sm: 'row' }}
                                justify="space-between"
                                align={{ base: 'start', sm: 'center' }}
                            >
                                <Heading
                                    color="white"
                                    size="xl"
                                    bgGradient="linear(to-r, white, whiteAlpha.800)"
                                    bgClip="text"
                                >
                                    My Orders
                                </Heading>
                                <Text color="whiteAlpha.800">
                                    {orders.length} order{orders.length !== 1 ? 's' : ''}
                                </Text>
                            </Stack>

                            {error ? (
                                <Alert status="error" borderRadius="md" bg="red.900" color="white">
                                    <AlertIcon />
                                    <AlertTitle mr={2}>Error!</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            ) : orders.length > 0 ? (
                                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                                    {orders.map((order) => (
                                        <OrderCard key={order.orderNumber} order={order} />
                                    ))}
                                </SimpleGrid>
                            ) : (
                                <Card
                                    bg="rgba(0, 0, 0, 0.6)"
                                    backdropFilter="blur(10px)"
                                    borderWidth="1px"
                                    borderColor="whiteAlpha.200"
                                >
                                    <CardBody>
                                        <VStack spacing={4} py={8}>
                                            <Text color="white" fontSize="lg">
                                                No orders yet
                                            </Text>
                                            <Button
                                                as="a"
                                                href="/shop"
                                                colorScheme="blue"
                                            >
                                                Start Shopping
                                            </Button>
                                        </VStack>
                                    </CardBody>
                                </Card>
                            )}
                        </VStack>
                    </Container>
                </Box>
            </Box>
        </>
    );
} 