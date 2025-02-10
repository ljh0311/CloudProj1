import {
    Box,
    Container,
    VStack,
    Heading,
    Text,
    Button,
    Avatar,
    FormControl,
    FormLabel,
    Input,
    useToast,
    HStack,
    Divider,
    SimpleGrid,
    Card,
    CardBody,
    IconButton,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    ModalFooter,
    Badge
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';
import { EditIcon } from '@chakra-ui/icons';

export default function Profile() {
    const { data: session, update } = useSession();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();

    // Initialize form data with session data
    useState(() => {
        if (session?.user) {
            setFormData(prev => ({
                ...prev,
                name: session.user.name,
                email: session.user.email
            }));
        }
    }, [session]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdateProfile = async () => {
        try {
            const response = await fetch('/api/user/update-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            // Update the session with new data
            await update({
                ...session,
                user: {
                    ...session.user,
                    name: formData.name,
                    email: formData.email
                }
            });

            toast({
                title: 'Profile Updated',
                description: 'Your profile has been successfully updated.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            setIsEditing(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleChangePassword = async () => {
        if (formData.newPassword !== formData.confirmPassword) {
            toast({
                title: 'Error',
                description: 'New passwords do not match',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            const response = await fetch('/api/user/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to change password');
            }

            toast({
                title: 'Password Updated',
                description: 'Your password has been successfully changed.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            // Reset password fields
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));

            onClose();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    if (!session) {
        return null; // Protected by middleware, should redirect to login
    }

    return (
        <>
            <Head>
                <title>Profile | KAPPY</title>
                <meta name="description" content="Manage your KAPPY account settings and preferences" />
            </Head>

            <Box position="relative" minH="100vh" bg="black" overflow="hidden">
                <AnimatedBackground />
                
                <Box position="relative" zIndex={1}>
                    <Navbar />

                    <Container maxW="container.lg" py={12}>
                        <VStack spacing={8} align="stretch">
                            <Card
                                bg="rgba(0, 0, 0, 0.6)"
                                backdropFilter="blur(10px)"
                                borderWidth="1px"
                                borderColor="whiteAlpha.200"
                            >
                                <CardBody>
                                    <VStack spacing={6} align="center">
                                        <Avatar
                                            size="2xl"
                                            name={session.user.name}
                                            src={session.user.image}
                                        />
                                        <VStack spacing={2}>
                                            <Heading color="white" size="lg">
                                                {session.user.name}
                                            </Heading>
                                            <Text color="whiteAlpha.800">
                                                {session.user.email}
                                            </Text>
                                            <Badge colorScheme="purple">
                                                {session.user.role}
                                            </Badge>
                                        </VStack>
                                    </VStack>
                                </CardBody>
                            </Card>

                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                {/* Profile Information */}
                                <Card
                                    bg="rgba(0, 0, 0, 0.6)"
                                    backdropFilter="blur(10px)"
                                    borderWidth="1px"
                                    borderColor="whiteAlpha.200"
                                >
                                    <CardBody>
                                        <VStack spacing={6} align="stretch">
                                            <HStack justify="space-between">
                                                <Heading size="md" color="white">
                                                    Profile Information
                                                </Heading>
                                                <IconButton
                                                    icon={<EditIcon />}
                                                    variant="ghost"
                                                    color="white"
                                                    onClick={() => setIsEditing(!isEditing)}
                                                    aria-label="Edit profile"
                                                />
                                            </HStack>
                                            <Divider borderColor="whiteAlpha.200" />
                                            <VStack spacing={4} align="stretch">
                                                <FormControl>
                                                    <FormLabel color="white">Name</FormLabel>
                                                    <Input
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        isDisabled={!isEditing}
                                                        bg="whiteAlpha.100"
                                                        color="white"
                                                        borderColor="whiteAlpha.200"
                                                    />
                                                </FormControl>
                                                <FormControl>
                                                    <FormLabel color="white">Email</FormLabel>
                                                    <Input
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        isDisabled={!isEditing}
                                                        bg="whiteAlpha.100"
                                                        color="white"
                                                        borderColor="whiteAlpha.200"
                                                    />
                                                </FormControl>
                                                {isEditing && (
                                                    <Button
                                                        colorScheme="blue"
                                                        onClick={handleUpdateProfile}
                                                    >
                                                        Save Changes
                                                    </Button>
                                                )}
                                            </VStack>
                                        </VStack>
                                    </CardBody>
                                </Card>

                                {/* Security Settings */}
                                <Card
                                    bg="rgba(0, 0, 0, 0.6)"
                                    backdropFilter="blur(10px)"
                                    borderWidth="1px"
                                    borderColor="whiteAlpha.200"
                                >
                                    <CardBody>
                                        <VStack spacing={6} align="stretch">
                                            <Heading size="md" color="white">
                                                Security Settings
                                            </Heading>
                                            <Divider borderColor="whiteAlpha.200" />
                                            <Button
                                                colorScheme="blue"
                                                variant="outline"
                                                onClick={onOpen}
                                            >
                                                Change Password
                                            </Button>
                                        </VStack>
                                    </CardBody>
                                </Card>
                            </SimpleGrid>
                        </VStack>
                    </Container>
                </Box>
            </Box>

            {/* Change Password Modal */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay backdropFilter="blur(10px)" />
                <ModalContent bg="gray.900" color="white">
                    <ModalHeader>Change Password</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>Current Password</FormLabel>
                                <Input
                                    name="currentPassword"
                                    type="password"
                                    value={formData.currentPassword}
                                    onChange={handleInputChange}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>New Password</FormLabel>
                                <Input
                                    name="newPassword"
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={handleInputChange}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Confirm New Password</FormLabel>
                                <Input
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button colorScheme="blue" onClick={handleChangePassword}>
                            Change Password
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
} 