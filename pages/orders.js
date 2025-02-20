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
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';
import { formatDate } from '../utils/dateFormatter';

const OrderCard = ({ order }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();

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
                                Order #{order.orderNumber || order.id}
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
                                ${(order.total || order.totalAmount).toFixed(2)}
                            </Text>
                        </HStack>
                        <Text color="whiteAlpha.800" fontSize="sm">
                            {JSON.parse(order.items || '[]').length} item{JSON.parse(order.items || '[]').length !== 1 ? 's' : ''}
                        </Text>
                    </VStack>
                </CardBody>
            </Card>

            {/* Order Details Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay backdropFilter="blur(10px)" />
                <ModalContent bg="gray.900" color="white">
                    <ModalHeader>Order Details #{order.id}</ModalHeader>
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
                                    {JSON.parse(order.items || '[]').map((item, index) => (
                                        <Tr key={index}>
                                            <Td>
                                                <HStack>
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        boxSize="40px"
                                                        objectFit="cover"
                                                        borderRadius="md"
                                                    />
                                                    <Text>{item.name}</Text>
                                                </HStack>
                                            </Td>
                                            <Td>{item.size}</Td>
                                            <Td isNumeric>{item.quantity}</Td>
                                            <Td isNumeric>${(item.price * item.quantity).toFixed(2)}</Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>

                            <Divider borderColor="whiteAlpha.200" />

                            <HStack justify="space-between">
                                <Text fontWeight="bold">Total Amount:</Text>
                                <Text fontWeight="bold">${(order.total || order.totalAmount).toFixed(2)}</Text>
                            </HStack>

                            {order.status === 'processing' && (
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

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch('/api/orders/get-user-orders');
                const data = await response.json();
                if (response.ok) {
                    setOrders(data.orders);
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
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
                <Navbar />
                <Container maxW="container.xl" py={12}>
                    <Text color="white">Loading orders...</Text>
                </Container>
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

                            {orders.length > 0 ? (
                                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                                    {orders.map((order) => (
                                        <OrderCard key={order.id} order={order} />
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