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

export default function AdminDashboard() {
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
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
                const [productsRes, usersRes] = await Promise.all([
                    fetch('/api/admin/getData?type=products'),
                    fetch('/api/admin/getData?type=users')
                ]);

                if (!productsRes.ok || !usersRes.ok) {
                    throw new Error('Failed to fetch data');
                }

                const productsData = await productsRes.json();
                const usersData = await usersRes.json();

                setProducts(productsData.products || []);
                setUsers(usersData.users || []);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast({
                    title: "Error",
                    description: "Failed to load data",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [toast]);

    // Function to update data through API
    const updateData = async (type, newData) => {
        try {
            const response = await fetch('/api/admin/updateData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type,
                    data: type === 'products' 
                        ? { products: newData, lastId: newData[newData.length - 1]?.id || 0 }
                        : { users: newData, lastId: newData[newData.length - 1]?.id || 0 }
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update data');
            }
        } catch (error) {
            console.error('Error updating data:', error);
            toast({
                title: "Error",
                description: "Failed to save changes",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    // Product Management Functions
    const handleAddProduct = async (productData) => {
        const newProduct = {
            ...productData,
            id: products.length + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const updatedProducts = [...products, newProduct];
        setProducts(updatedProducts);
        await updateData('products', updatedProducts);
        onProductModalClose();
        toast({
            title: "Product added successfully",
            status: "success",
            duration: 3000,
            isClosable: true,
        });
    };

    const handleUpdateProduct = async (productData) => {
        const updatedProducts = products.map(product =>
            product.id === selectedItem.id
                ? { ...product, ...productData, updatedAt: new Date().toISOString() }
                : product
        );
        setProducts(updatedProducts);
        await updateData('products', updatedProducts);
        onProductModalClose();
        toast({
            title: "Product updated successfully",
            status: "success",
            duration: 3000,
            isClosable: true,
        });
    };

    const handleDeleteProduct = async (id) => {
        const updatedProducts = products.filter(product => product.id !== id);
        setProducts(updatedProducts);
        await updateData('products', updatedProducts);
        setIsDeleteDialogOpen(false);
        toast({
            title: "Product deleted successfully",
            status: "success",
            duration: 3000,
            isClosable: true,
        });
    };

    // User Management Functions
    const handleAddUser = async (userData) => {
        const newUser = {
            ...userData,
            id: users.length + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            orders: [],
            cart: []
        };
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        await updateData('users', updatedUsers);
        onUserModalClose();
        toast({
            title: "User added successfully",
            status: "success",
            duration: 3000,
            isClosable: true,
        });
    };

    const handleUpdateUser = async (userData) => {
        const updatedUsers = users.map(user =>
            user.id === selectedItem.id
                ? { ...user, ...userData, updatedAt: new Date().toISOString() }
                : user
        );
        setUsers(updatedUsers);
        await updateData('users', updatedUsers);
        onUserModalClose();
        toast({
            title: "User updated successfully",
            status: "success",
            duration: 3000,
            isClosable: true,
        });
    };

    const handleDeleteUser = async (id) => {
        const updatedUsers = users.filter(user => user.id !== id);
        setUsers(updatedUsers);
        await updateData('users', updatedUsers);
        setIsDeleteDialogOpen(false);
        toast({
            title: "User deleted successfully",
            status: "success",
            duration: 3000,
            isClosable: true,
        });
    };

    // Add this function to handle password viewing
    const handleViewPassword = async (userId) => {
        try {
            const response = await fetch('/api/admin/view-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            });

            if (!response.ok) {
                throw new Error('Failed to retrieve password');
            }

            const data = await response.json();
            setShowPassword(prev => ({
                ...prev,
                [userId]: data.password
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
                description: "Failed to retrieve password",
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
    
    if (!session || session.user.role !== 'admin') {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        };
    }

    return {
        props: { session }
    };
} 