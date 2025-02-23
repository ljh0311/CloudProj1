import {
    Box,
    Container,
    Heading,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Button,
    useToast,
    HStack,
    Text,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    VStack,
    Select,
    Badge,
    IconButton,
    Tooltip,
    useColorModeValue,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Spinner,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons';
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/Navbar';
import AnimatedBackground from '../../components/AnimatedBackground';
import { formatDate } from '../../utils/dateFormatter';
import { getSession } from 'next-auth/react';

// Product Form Component
const ProductForm = ({ initialData, onSubmit, onClose }) => {
    const [formData, setFormData] = useState(initialData || {
        name: '',
        price: '',
        category: '',
        image: '',
        material: '',
        description: '',
        size_s_stock: 20,
        size_m_stock: 20,
        size_l_stock: 20
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.includes('price') || name.includes('stock') 
                ? parseFloat(value) 
                : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
                <FormControl isRequired>
                    <FormLabel>Name</FormLabel>
                    <Input name="name" value={formData.name} onChange={handleChange} />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Price</FormLabel>
                    <Input name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Category</FormLabel>
                    <Select name="category" value={formData.category} onChange={handleChange}>
                        <option value="Graphic Tees">Graphic Tees</option>
                        <option value="Band Tees">Band Tees</option>
                        <option value="Basic Tees">Basic Tees</option>
                        <option value="Sports">Sports</option>
                    </Select>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Image URL</FormLabel>
                    <Input name="image" value={formData.image} onChange={handleChange} />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Material</FormLabel>
                    <Input name="material" value={formData.material} onChange={handleChange} />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Description</FormLabel>
                    <Input name="description" value={formData.description} onChange={handleChange} />
                </FormControl>

                <HStack width="100%" spacing={4}>
                    <FormControl>
                        <FormLabel>Size S Stock</FormLabel>
                        <Input name="size_s_stock" type="number" value={formData.size_s_stock} onChange={handleChange} />
                    </FormControl>

                    <FormControl>
                        <FormLabel>Size M Stock</FormLabel>
                        <Input name="size_m_stock" type="number" value={formData.size_m_stock} onChange={handleChange} />
                    </FormControl>

                    <FormControl>
                        <FormLabel>Size L Stock</FormLabel>
                        <Input name="size_l_stock" type="number" value={formData.size_l_stock} onChange={handleChange} />
                    </FormControl>
                </HStack>

                <Button type="submit" colorScheme="blue" width="100%">
                    {initialData ? 'Update Product' : 'Add Product'}
                </Button>
            </VStack>
        </form>
    );
};

// User Form Component
const UserForm = ({ initialData, onSubmit, onClose }) => {
    const [formData, setFormData] = useState(initialData || {
        name: '',
        email: '',
        password: '',
        role: 'customer'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
                <FormControl isRequired>
                    <FormLabel>Name</FormLabel>
                    <Input name="name" value={formData.name} onChange={handleChange} />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input name="email" type="email" value={formData.email} onChange={handleChange} />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input name="password" type="password" value={formData.password} onChange={handleChange} />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Role</FormLabel>
                    <Select name="role" value={formData.role} onChange={handleChange}>
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                    </Select>
                </FormControl>

                <Button type="submit" colorScheme="blue" width="100%">
                    {initialData ? 'Update User' : 'Add User'}
                </Button>
            </VStack>
        </form>
    );
};

// Order Management Component
const OrdersPanel = ({ orders, onUpdateStatus, onDeleteOrder }) => {
    return (
        <Box
            bg="rgba(0, 0, 0, 0.4)"
            backdropFilter="blur(8px)"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            overflowX="auto"
        >
            <Table variant="simple">
                <Thead>
                    <Tr>
                        <Th color="white">Order Number</Th>
                        <Th color="white">Customer</Th>
                        <Th color="white">Date</Th>
                        <Th color="white">Total</Th>
                        <Th color="white">Status</Th>
                        <Th color="white">Actions</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {orders.map((order) => (
                        <Tr key={order.id}>
                            <Td color="white">{order.orderNumber}</Td>
                            <Td color="white">
                                <VStack align="start" spacing={0}>
                                    <Text>{order.userName}</Text>
                                    <Text fontSize="sm" color="whiteAlpha.700">{order.userEmail}</Text>
                                </VStack>
                            </Td>
                            <Td color="white">{formatDate(order.createdAt)}</Td>
                            <Td color="white">${Number(order.total).toFixed(2)}</Td>
                            <Td>
                                <Select
                                    value={order.status}
                                    onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                                    bg="whiteAlpha.200"
                                    color="white"
                                    borderColor="whiteAlpha.300"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </Select>
                            </Td>
                            <Td>
                                <HStack spacing={2}>
                                    <IconButton
                                        icon={<DeleteIcon />}
                                        onClick={() => onDeleteOrder(order.id)}
                                        colorScheme="red"
                                        variant="ghost"
                                    />
                                </HStack>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
    );
};

export default function AdminDashboard() {
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const cancelRef = useRef();
    const toast = useToast();
    const [showPassword, setShowPassword] = useState({});

    const {
        isOpen: isProductModalOpen,
        onOpen: onProductModalOpen,
        onClose: onProductModalClose
    } = useDisclosure();

    const {
        isOpen: isUserModalOpen,
        onOpen: onUserModalOpen,
        onClose: onUserModalClose
    } = useDisclosure();

    // Fetch data on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('Fetching admin dashboard data...');

                // Fetch all data in parallel
                const responses = await Promise.all([
                    fetch('/api/admin/products').then(async (res) => {
                        if (!res.ok) {
                            const error = await res.text();
                            throw new Error(`Products API error: ${error}`);
                        }
                        return res.json();
                    }),
                    fetch('/api/admin/users').then(async (res) => {
                        if (!res.ok) {
                            const error = await res.text();
                            throw new Error(`Users API error: ${error}`);
                        }
                        return res.json();
                    }),
                    fetch('/api/admin/orders').then(async (res) => {
                        if (!res.ok) {
                            const error = await res.text();
                            throw new Error(`Orders API error: ${error}`);
                        }
                        return res.json();
                    })
                ]);

                const [productsData, usersData, ordersData] = responses;

                console.log('Data fetched successfully:', {
                    products: productsData?.data?.length || 0,
                    users: usersData?.data?.length || 0,
                    orders: ordersData?.data?.length || 0
                });

                setProducts(productsData?.data || []);
                setUsers(usersData?.data || []);
                setOrders(ordersData?.data || []);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setError(error.message);
                toast({
                    title: "Error loading data",
                    description: error.message,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [toast]);

    // Show loading state
    if (loading) {
        return (
            <Box minH="100vh" position="relative">
                <AnimatedBackground />
                <Box position="relative" zIndex={1}>
                    <Navbar />
                    <Container maxW="container.xl" py={8}>
                        <VStack spacing={8}>
                            <Heading color="white">Admin Dashboard</Heading>
                            <Spinner size="xl" color="blue.500" />
                            <Text color="white">Loading dashboard data...</Text>
                        </VStack>
                    </Container>
                </Box>
            </Box>
        );
    }

    // Show error state
    if (error) {
        return (
            <Box minH="100vh" position="relative">
                <AnimatedBackground />
                <Box position="relative" zIndex={1}>
                    <Navbar />
                    <Container maxW="container.xl" py={8}>
                        <VStack spacing={8}>
                            <Heading color="white">Admin Dashboard</Heading>
                            <Alert status="error" variant="solid" borderRadius="md">
                                <AlertIcon />
                                <Box>
                                    <AlertTitle>Error loading dashboard</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Box>
                            </Alert>
                            <Button
                                colorScheme="blue"
                                onClick={() => window.location.reload()}
                            >
                                Retry Loading
                            </Button>
                        </VStack>
                    </Container>
                </Box>
            </Box>
        );
    }

    // Product Management Functions
    const handleAddProduct = async (productData) => {
        try {
            const response = await fetch('/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to add product');
            }

            setProducts(prev => [...prev, result.data]);
            onProductModalClose();
            toast({
                title: "Success",
                description: "Product added successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleUpdateProduct = async (productData) => {
        try {
            const response = await fetch('/api/admin/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...productData, id: selectedItem.id })
            });

            const updateResult = await response.json();
            if (!response.ok) {
                throw new Error(updateResult.error || 'Failed to update product');
            }

            setProducts(prev => prev.map(product => 
                product.id === selectedItem.id ? updateResult.data : product
            ));
            onProductModalClose();
            toast({
                title: "Success",
                description: "Product updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleDeleteProduct = async (id) => {
        try {
            const response = await fetch(`/api/admin/products?id=${id}`, {
                method: 'DELETE'
            });

            const deleteResult = await response.json();
            if (!response.ok) {
                throw new Error(deleteResult.error || 'Failed to delete product');
            }

            setProducts(prev => prev.filter(product => product.id !== id));
            setIsDeleteDialogOpen(false);
            toast({
                title: "Success",
                description: "Product deleted successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    // User Management Functions
    const handleAddUser = async (userData) => {
        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to add user');
            }

            setUsers(prev => [...prev, result.data]);
            onUserModalClose();
            toast({
                title: "Success",
                description: "User added successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleUpdateUser = async (userData) => {
        try {
            const response = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...userData, id: selectedItem.id })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to update user');
            }

            setUsers(prev => prev.map(user => 
                user.id === selectedItem.id ? result.data : user
            ));
            onUserModalClose();
            toast({
                title: "Success",
                description: "User updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleDeleteUser = async (id) => {
        try {
            const response = await fetch(`/api/admin/users?id=${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete user');
            }

            setUsers(prev => prev.filter(user => user.id !== id));
            setIsDeleteDialogOpen(false);
            toast({
                title: "Success",
                description: "User deleted successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleViewPassword = async (userId) => {
        try {
            const response = await fetch('/api/admin/view-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to retrieve password');
            }

            setShowPassword(prev => ({
                ...prev,
                [userId]: result.password
            }));

            // Auto-hide password after 10 seconds
            setTimeout(() => {
                setShowPassword(prev => ({
                    ...prev,
                    [userId]: null
                }));
            }, 10000);
        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    // Order Management Functions
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            const response = await fetch('/api/admin/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, status: newStatus })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to update order status');
            }

            setOrders(prev => prev.map(order => 
                order.id === orderId ? { ...order, status: newStatus } : order
            ));

            toast({
                title: "Success",
                description: "Order status updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleDeleteOrder = async (orderId) => {
        try {
            const response = await fetch(`/api/admin/orders?id=${orderId}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete order');
            }

            setOrders(prev => prev.filter(order => order.id !== orderId));
            toast({
                title: "Success",
                description: "Order deleted successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <>
            <Head>
                <title>Admin Dashboard | KAPPY</title>
                <meta name="description" content="Admin dashboard for managing KAPPY's e-commerce platform" />
            </Head>

            <Box position="relative" minH="100vh" bg="white" overflow="hidden">
                <AnimatedBackground />
                
                <Box position="relative" zIndex={1}>
                    <Navbar />

                    <Container maxW="container.xl" py={8}>
                        <Heading 
                            color="white" 
                            mb={8}
                            textAlign="center"
                            bgGradient="linear(to-r, white, whiteAlpha.800)"
                            bgClip="text"
                        >
                            Admin Dashboard
                        </Heading>

                        <Tabs variant="enclosed" colorScheme="white">
                            <TabList>
                                <Tab color="white" _selected={{ bg: 'whiteAlpha.200' }}>Products</Tab>
                                <Tab color="white" _selected={{ bg: 'whiteAlpha.200' }}>Users</Tab>
                                <Tab color="white" _selected={{ bg: 'whiteAlpha.200' }}>Orders</Tab>
                            </TabList>

                            <TabPanels>
                                {/* Products Panel */}
                                <TabPanel>
                                    <Button
                                        leftIcon={<AddIcon />}
                                        colorScheme="blue"
                                        mb={4}
                                        onClick={() => {
                                            setSelectedItem(null);
                                            onProductModalOpen();
                                        }}
                                    >
                                        Add New Product
                                    </Button>

                                    <Box
                                        bg="rgba(0, 0, 0, 0.4)"
                                        backdropFilter="blur(8px)"
                                        borderRadius="lg"
                                        borderWidth="1px"
                                        borderColor="whiteAlpha.200"
                                        overflowX="auto"
                                    >
                                        <Table variant="simple">
                                            <Thead>
                                                <Tr>
                                                    <Th color="white">ID</Th>
                                                    <Th color="white">Name</Th>
                                                    <Th color="white">Category</Th>
                                                    <Th color="white">Price</Th>
                                                    <Th color="white">Stock (S/M/L)</Th>
                                                    <Th color="white">Actions</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {products.map((product) => (
                                                    <Tr key={product.id}>
                                                        <Td color="white">{product.id}</Td>
                                                        <Td color="white">{product.name}</Td>
                                                        <Td color="white">{product.category}</Td>
                                                        <Td color="white">${product.price}</Td>
                                                        <Td color="white">
                                                            {product.size_s_stock}/{product.size_m_stock}/{product.size_l_stock}
                                                        </Td>
                                                        <Td>
                                                            <HStack spacing={2}>
                                                                <IconButton
                                                                    icon={<EditIcon />}
                                                                    onClick={() => {
                                                                        setSelectedItem(product);
                                                                        onProductModalOpen();
                                                                    }}
                                                                    colorScheme="blue"
                                                                    variant="ghost"
                                                                />
                                                                <IconButton
                                                                    icon={<DeleteIcon />}
                                                                    onClick={() => {
                                                                        setItemToDelete({ id: product.id, type: 'product' });
                                                                        setIsDeleteDialogOpen(true);
                                                                    }}
                                                                    colorScheme="red"
                                                                    variant="ghost"
                                                                />
                                                            </HStack>
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </Box>
                                </TabPanel>

                                {/* Users Panel */}
                                <TabPanel>
                                    <Button
                                        leftIcon={<AddIcon />}
                                        colorScheme="blue"
                                        mb={4}
                                        onClick={() => {
                                            setSelectedItem(null);
                                            onUserModalOpen();
                                        }}
                                    >
                                        Add New User
                                    </Button>

                                    <Box
                                        bg="rgba(0, 0, 0, 0.4)"
                                        backdropFilter="blur(8px)"
                                        borderRadius="lg"
                                        borderWidth="1px"
                                        borderColor="whiteAlpha.200"
                                        overflowX="auto"
                                    >
                                        <Table variant="simple">
                                            <Thead>
                                                <Tr>
                                                    <Th color="white">ID</Th>
                                                    <Th color="white">Name</Th>
                                                    <Th color="white">Email</Th>
                                                    <Th color="white">Role</Th>
                                                    <Th color="white">Password</Th>
                                                    <Th color="white">Created At</Th>
                                                    <Th color="white">Actions</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {users.map((user) => (
                                                    <Tr key={user.id}>
                                                        <Td color="white">{user.id}</Td>
                                                        <Td color="white">{user.name}</Td>
                                                        <Td color="white">{user.email}</Td>
                                                        <Td>
                                                            <Badge
                                                                colorScheme={user.role === 'admin' ? 'red' : 'green'}
                                                            >
                                                                {user.role}
                                                            </Badge>
                                                        </Td>
                                                        <Td color="white">
                                                            {showPassword[user.id] ? (
                                                                <HStack>
                                                                    <Text color="yellow.300">{showPassword[user.id]}</Text>
                                                                    <Button
                                                                        size="sm"
                                                                        colorScheme="red"
                                                                        onClick={() => setShowPassword(prev => ({
                                                                            ...prev,
                                                                            [user.id]: null
                                                                        }))}
                                                                    >
                                                                        Hide
                                                                    </Button>
                                                                </HStack>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    colorScheme="blue"
                                                                    onClick={() => handleViewPassword(user.id)}
                                                                >
                                                                    View Password
                                                                </Button>
                                                            )}
                                                        </Td>
                                                        <Td color="white">
                                                            {formatDate(user.createdAt)}
                                                        </Td>
                                                        <Td>
                                                            <HStack spacing={2}>
                                                                <IconButton
                                                                    icon={<EditIcon />}
                                                                    onClick={() => {
                                                                        setSelectedItem(user);
                                                                        onUserModalOpen();
                                                                    }}
                                                                    colorScheme="blue"
                                                                    variant="ghost"
                                                                />
                                                                <IconButton
                                                                    icon={<DeleteIcon />}
                                                                    onClick={() => {
                                                                        setItemToDelete({ id: user.id, type: 'user' });
                                                                        setIsDeleteDialogOpen(true);
                                                                    }}
                                                                    colorScheme="red"
                                                                    variant="ghost"
                                                                />
                                                            </HStack>
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </Box>
                                </TabPanel>

                                {/* Orders Panel */}
                                <TabPanel>
                                    <OrdersPanel
                                        orders={orders}
                                        onUpdateStatus={handleUpdateOrderStatus}
                                        onDeleteOrder={handleDeleteOrder}
                                    />
                                </TabPanel>
                            </TabPanels>
                        </Tabs>

                        {/* Product Modal */}
                        <Modal isOpen={isProductModalOpen} onClose={onProductModalClose} size="xl">
                            <ModalOverlay backdropFilter="blur(10px)" />
                            <ModalContent bg="white" borderWidth="1px" borderColor="whiteAlpha.200">
                                <ModalHeader color="black">
                                    {selectedItem ? 'Edit Product' : 'Add New Product'}
                                </ModalHeader>
                                <ModalCloseButton color="white" />
                                <ModalBody pb={6}>
                                    <ProductForm
                                        initialData={selectedItem}
                                        onSubmit={selectedItem ? handleUpdateProduct : handleAddProduct}
                                        onClose={onProductModalClose}
                                    />
                                </ModalBody>
                            </ModalContent>
                        </Modal>

                        {/* User Modal */}
                        <Modal isOpen={isUserModalOpen} onClose={onUserModalClose} size="xl">
                            <ModalOverlay backdropFilter="blur(10px)" />
                            <ModalContent bg="white" borderWidth="1px" borderColor="whiteAlpha.200">
                                <ModalHeader color="black">
                                    {selectedItem ? 'Edit User' : 'Add New User'}
                                </ModalHeader>


                                <ModalCloseButton color="white" />
                                <ModalBody pb={6}>
                                    <UserForm
                                        initialData={selectedItem}
                                        onSubmit={selectedItem ? handleUpdateUser : handleAddUser}
                                        onClose={onUserModalClose}
                                    />
                                </ModalBody>
                            </ModalContent>
                        </Modal>

                        {/* Delete Confirmation Dialog */}
                        <AlertDialog
                            isOpen={isDeleteDialogOpen}
                            leastDestructiveRef={cancelRef}
                            onClose={() => setIsDeleteDialogOpen(false)}
                        >
                            <AlertDialogOverlay>
                                <AlertDialogContent bg="white" borderWidth="1px" borderColor="whiteAlpha.200">
                                    <AlertDialogHeader color="white">
                                        Delete {itemToDelete?.type}
                                    </AlertDialogHeader>
                                    <AlertDialogBody color="white">
                                        Are you sure? This action cannot be undone.
                                    </AlertDialogBody>
                                    <AlertDialogFooter>
                                        <Button ref={cancelRef} onClick={() => setIsDeleteDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            colorScheme="red"
                                            onClick={() => {
                                                if (itemToDelete?.type === 'product') {
                                                    handleDeleteProduct(itemToDelete.id);
                                                } else {
                                                    handleDeleteUser(itemToDelete.id);
                                                }
                                            }}
                                            ml={3}
                                        >
                                            Delete
                                        </Button>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialogOverlay>
                        </AlertDialog>
                    </Container>
                </Box>
            </Box>
        </>
    );
}

export async function getServerSideProps(context) {
    const session = await getSession(context);
    
    // Check if user is not authenticated at all
    if (!session) {
        return {
            redirect: {
                destination: '/auth/signin',
                permanent: false,
            },
        };
    }

    // Check if user exists and has a role property
    if (!session.user || !session.user.role) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
            props: {
                error: 'User role not found'
            }
        };
    }

    // Check if user is not an admin
    if (session.user.role !== 'admin') {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
            props: {
                error: 'Unauthorized access'
            }
        };
    }

    // If all checks pass, return the session
    return {
        props: { 
            session,
            user: session.user
        }
    };
} 