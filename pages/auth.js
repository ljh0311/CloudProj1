import {
    Box,
    Button,
    Container,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Stack,
    Text,
    useToast,
    HStack,
    Switch,
    InputGroup,
    InputRightElement,
    IconButton,
    FormErrorMessage,
    Divider,
} from '@chakra-ui/react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Head from 'next/head';
import AnimatedBackground from '../components/AnimatedBackground';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import Link from 'next/link';

export default function Auth() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const toast = useToast();

    const validateForm = () => {
        const newErrors = {};
        if (isSignUp) {
            if (!formData.name) newErrors.name = 'Name is required';
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
        }
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            if (isSignUp) {
                // Handle signup
                const res = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.name,
                        email: formData.email,
                        password: formData.password
                    }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Something went wrong');
                }

                // Auto login after successful signup
                await signIn('credentials', {
                    redirect: false,
                    email: formData.email,
                    password: formData.password,
                });

                router.push('/');
            } else {
                // Handle login
                const result = await signIn('credentials', {
                    redirect: false,
                    email: formData.email,
                    password: formData.password,
                });

                if (result.error) {
                    throw new Error('Invalid email or password');
                }

                const returnUrl = router.query.returnUrl || '/';
                router.push(returnUrl);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    return (
        <>
            <Head>
                <title>{isSignUp ? 'Sign Up' : 'Login'} | KAPPY</title>
                <meta name="description" content={isSignUp ? 'Create your KAPPY account' : 'Login to your KAPPY account'} />
            </Head>

            <Box position="relative" minH="100vh" bg="black" overflow="hidden">
                <AnimatedBackground />
                
                <Box position="relative" zIndex={1}>
                    <Container maxW="container.sm" py={20}>
                        <Box
                            bg="rgba(0, 0, 0, 0.4)"
                            backdropFilter="blur(8px)"
                            p={8}
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor="whiteAlpha.200"
                        >
                            <Stack spacing={6}>
                                <Heading 
                                    color="white" 
                                    textAlign="center"
                                    bgGradient="linear(to-r, white, whiteAlpha.800)"
                                    bgClip="text"
                                >
                                    {isSignUp ? 'Create Account' : 'Welcome Back'}
                                </Heading>

                                <HStack justify="center" spacing={2}>
                                    <Text color="white">
                                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                                    </Text>
                                    <Button
                                        variant="link"
                                        color="blue.300"
                                        onClick={() => setIsSignUp(!isSignUp)}
                                    >
                                        {isSignUp ? 'Sign In' : 'Sign Up'}
                                    </Button>
                                </HStack>

                                <form onSubmit={handleSubmit}>
                                    <Stack spacing={4}>
                                        {isSignUp && (
                                            <FormControl isRequired isInvalid={!!errors.name}>
                                                <FormLabel color="white">Name</FormLabel>
                                                <Input
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    bg="whiteAlpha.100"
                                                    color="white"
                                                    _placeholder={{ color: 'whiteAlpha.500' }}
                                                />
                                                <FormErrorMessage>{errors.name}</FormErrorMessage>
                                            </FormControl>
                                        )}

                                        <FormControl isRequired isInvalid={!!errors.email}>
                                            <FormLabel color="white">Email</FormLabel>
                                            <Input
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                bg="whiteAlpha.100"
                                                color="white"
                                                _placeholder={{ color: 'whiteAlpha.500' }}
                                            />
                                            <FormErrorMessage>{errors.email}</FormErrorMessage>
                                        </FormControl>

                                        <FormControl isRequired isInvalid={!!errors.password}>
                                            <FormLabel color="white">Password</FormLabel>
                                            <InputGroup>
                                                <Input
                                                    name="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    bg="whiteAlpha.100"
                                                    color="white"
                                                    _placeholder={{ color: 'whiteAlpha.500' }}
                                                />
                                                <InputRightElement>
                                                    <IconButton
                                                        variant="ghost"
                                                        color="white"
                                                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                    />
                                                </InputRightElement>
                                            </InputGroup>
                                            <FormErrorMessage>{errors.password}</FormErrorMessage>
                                        </FormControl>

                                        {isSignUp && (
                                            <FormControl isRequired isInvalid={!!errors.confirmPassword}>
                                                <FormLabel color="white">Confirm Password</FormLabel>
                                                <Input
                                                    name="confirmPassword"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    bg="whiteAlpha.100"
                                                    color="white"
                                                    _placeholder={{ color: 'whiteAlpha.500' }}
                                                />
                                                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                                            </FormControl>
                                        )}

                                        <Button
                                            type="submit"
                                            colorScheme="blue"
                                            size="lg"
                                            fontSize="md"
                                            isLoading={isLoading}
                                            w="100%"
                                            mt={4}
                                        >
                                            {isSignUp ? 'Create Account' : 'Sign In'}
                                        </Button>
                                    </Stack>
                                </form>

                                {!isSignUp && (
                                    <Button
                                        as={Link}
                                        href="/auth/forgot-password"
                                        variant="link"
                                        color="blue.300"
                                        size="sm"
                                        alignSelf="center"
                                    >
                                        Forgot Password?
                                    </Button>
                                )}
                            </Stack>
                        </Box>
                    </Container>
                </Box>
            </Box>
        </>
    );
} 