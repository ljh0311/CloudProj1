import {
    Box,
    Container,
    VStack,
    Heading,
    Text,
    Button,
    FormControl,
    FormLabel,
    Input,
    SimpleGrid,
    Card,
    CardBody,
    Divider,
    useToast,
    FormErrorMessage,
    InputGroup,
    InputRightElement,
    HStack,
    Badge,
    Image
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';
import { useCart } from '../components/CartContext';

// Detect card type based on first digit
const getCardType = (number) => {
    const firstDigit = number.charAt(0);
    switch (firstDigit) {
        case '4':
            return { type: 'Visa', color: 'blue' };
        case '5':
            return { type: 'Mastercard', color: 'red' };
        case '6':
            return { type: 'AMEX', color: 'green' };
        default:
            return { type: 'Unknown', color: 'gray' };
    }
};

export default function Checkout() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const toast = useToast();
    const { cartItems, getCartTotal, clearCart } = useCart();
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardType, setCardType] = useState({ type: '', color: 'gray' });
    const [paymentData, setPaymentData] = useState({
        cardNumber: '',
        cardHolder: '',
        expiryDate: '',
        cvv: ''
    });
    const [errors, setErrors] = useState({});

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth?returnUrl=/checkout');
        }
    }, [status, router]);

    if (status === 'loading') {
        return null;
    }

    if (!session) {
        return null;
    }

    if (cartItems.length === 0) {
        router.push('/cart');
        return null;
    }

    const validateForm = () => {
        const newErrors = {};
        
        // Card number validation (only check first digit and length)
        if (!paymentData.cardNumber || paymentData.cardNumber.length !== 16) {
            newErrors.cardNumber = 'Card number must be 16 digits';
        } else if (!['4', '5', '6'].includes(paymentData.cardNumber.charAt(0))) {
            newErrors.cardNumber = 'Card type not supported';
        }

        // Card holder validation
        if (!paymentData.cardHolder || paymentData.cardHolder.length < 3) {
            newErrors.cardHolder = 'Please enter the cardholder name';
        }

        // Expiry date validation (MM/YY format)
        const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
        if (!paymentData.expiryDate || !expiryRegex.test(paymentData.expiryDate)) {
            newErrors.expiryDate = 'Invalid expiry date (MM/YY)';
        } else {
            const [month, year] = paymentData.expiryDate.split('/');
            const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
            if (expiry < new Date()) {
                newErrors.expiryDate = 'Card has expired';
            }
        }

        // CVV validation
        if (!paymentData.cvv || !/^[0-9]{3,4}$/.test(paymentData.cvv)) {
            newErrors.cvv = 'Invalid CVV';
        } else {
            // Additional check for odd ending
            const lastDigit = parseInt(paymentData.cvv.slice(-1));
            if (lastDigit % 2 === 0) {
                newErrors.cvv = 'Card not accepted (CVV must end with odd number for testing)';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        // Format expiry date input
        if (name === 'expiryDate') {
            formattedValue = value
                .replace(/\D/g, '')
                .slice(0, 4)
                .replace(/(\d{2})(\d{2})/, '$1/$2')
                .replace(/(\d{2})(\d{1})/, '$1/$2');
        }

        // Format card number input and detect type
        if (name === 'cardNumber') {
            formattedValue = value.replace(/\D/g, '').slice(0, 16);
            if (formattedValue) {
                setCardType(getCardType(formattedValue));
            } else {
                setCardType({ type: '', color: 'gray' });
            }
        }

        // Format CVV input
        if (name === 'cvv') {
            formattedValue = value.replace(/\D/g, '').slice(0, 4);
        }

        setPaymentData(prev => ({
            ...prev,
            [name]: formattedValue
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const processPayment = async () => {
        if (!validateForm()) {
            toast({
                title: 'Validation Error',
                description: 'Please check your card details',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
            return;
        }

        setIsProcessing(true);

        try {
            // Calculate order totals
            const subtotal = getCartTotal();
            const tax = subtotal * 0.07; // 7% tax
            const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
            const total = subtotal + tax + shipping;

            console.log('Sending order request with data:', {
                subtotal,
                tax,
                shipping,
                total,
                itemsCount: cartItems.length
            });

            // Create order
            const response = await fetch('/api/orders/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: cartItems.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        size: item.size,
                        image: item.image
                    })),
                    subtotal: subtotal,
                    tax: tax,
                    shipping: shipping,
                    total: total,
                    status: 'pending',
                    shipping_address: {},
                    billing_address: {},
                    payment_method: {
                        type: 'card',
                        status: 'completed'
                    }
                }),
                credentials: 'include'
            });

            const data = await response.json();
            console.log('Order API response:', data);

            if (!response.ok) {
                throw new Error(data.error || `Failed to create order: ${response.status} ${response.statusText}`);
            }

            if (!data.success) {
                throw new Error(data.error || 'Order creation failed');
            }

            // Clear cart after successful payment
            clearCart();

            toast({
                title: 'Payment Successful',
                description: `Order #${data.order.order_number} has been placed successfully`,
                status: 'success',
                duration: 5000,
                isClosable: true
            });

            router.push('/orders');
        } catch (error) {
            console.error('Payment processing error:', error);
            toast({
                title: 'Payment Failed',
                description: error.message || 'Failed to process payment',
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <Head>
                <title>Checkout | KAPPY</title>
                <meta name="description" content="Complete your purchase securely" />
            </Head>

            <Box position="relative" minH="100vh" bg="black" overflow="hidden">
                <AnimatedBackground />
                
                <Box position="relative" zIndex={1}>
                    <Navbar />

                    <Container maxW="container.xl" py={12}>
                        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
                            {/* Payment Form */}
                            <Card
                                bg="rgba(0, 0, 0, 0.6)"
                                backdropFilter="blur(10px)"
                                borderWidth="1px"
                                borderColor="whiteAlpha.200"
                            >
                                <CardBody>
                                    <VStack spacing={6} align="stretch">
                                        <Heading size="lg" color="white">Payment Details</Heading>
                                        <Divider borderColor="whiteAlpha.200" />

                                        <FormControl isInvalid={!!errors.cardNumber}>
                                            <FormLabel color="white">Card Number</FormLabel>
                                            <InputGroup>
                                                <Input
                                                    name="cardNumber"
                                                    value={paymentData.cardNumber}
                                                    onChange={handleInputChange}
                                                    placeholder="1234 5678 9012 3456"
                                                    maxLength={16}
                                                    bg="whiteAlpha.100"
                                                    color="white"
                                                    borderColor="whiteAlpha.200"
                                                />
                                                {cardType.type && (
                                                    <InputRightElement width="4.5rem">
                                                        <Badge colorScheme={cardType.color}>
                                                            {cardType.type}
                                                        </Badge>
                                                    </InputRightElement>
                                                )}
                                            </InputGroup>
                                            <FormErrorMessage>{errors.cardNumber}</FormErrorMessage>
                                        </FormControl>

                                        <FormControl isInvalid={!!errors.cardHolder}>
                                            <FormLabel color="white">Cardholder Name</FormLabel>
                                            <Input
                                                name="cardHolder"
                                                value={paymentData.cardHolder}
                                                onChange={handleInputChange}
                                                placeholder="John Doe"
                                                bg="whiteAlpha.100"
                                                color="white"
                                                borderColor="whiteAlpha.200"
                                            />
                                            <FormErrorMessage>{errors.cardHolder}</FormErrorMessage>
                                        </FormControl>

                                        <HStack>
                                            <FormControl isInvalid={!!errors.expiryDate}>
                                                <FormLabel color="white">Expiry Date</FormLabel>
                                                <Input
                                                    name="expiryDate"
                                                    value={paymentData.expiryDate}
                                                    onChange={handleInputChange}
                                                    placeholder="MM/YY"
                                                    maxLength={5}
                                                    bg="whiteAlpha.100"
                                                    color="white"
                                                    borderColor="whiteAlpha.200"
                                                />
                                                <FormErrorMessage>{errors.expiryDate}</FormErrorMessage>
                                            </FormControl>

                                            <FormControl isInvalid={!!errors.cvv}>
                                                <FormLabel color="white">CVV</FormLabel>
                                                <Input
                                                    name="cvv"
                                                    value={paymentData.cvv}
                                                    onChange={handleInputChange}
                                                    placeholder="123"
                                                    maxLength={4}
                                                    bg="whiteAlpha.100"
                                                    color="white"
                                                    borderColor="whiteAlpha.200"
                                                />
                                                <FormErrorMessage>{errors.cvv}</FormErrorMessage>
                                            </FormControl>
                                        </HStack>
                                    </VStack>
                                </CardBody>
                            </Card>

                            {/* Order Summary */}
                            <Card
                                bg="rgba(0, 0, 0, 0.6)"
                                backdropFilter="blur(10px)"
                                borderWidth="1px"
                                borderColor="whiteAlpha.200"
                            >
                                <CardBody>
                                    <VStack spacing={6} align="stretch">
                                        <Heading size="lg" color="white">Order Summary</Heading>
                                        <Divider borderColor="whiteAlpha.200" />

                                        <VStack spacing={4} align="stretch">
                                            {cartItems.map((item) => (
                                                <HStack key={item.id} justify="space-between">
                                                    <VStack align="start" spacing={0}>
                                                        <Text color="white">{item.name}</Text>
                                                        <HStack>
                                                            <Badge colorScheme="purple">Size {item.size}</Badge>
                                                            <Text color="whiteAlpha.600">x{item.quantity}</Text>
                                                        </HStack>
                                                    </VStack>
                                                    <Text color="white">${(item.price * item.quantity).toFixed(2)}</Text>
                                                </HStack>
                                            ))}
                                        </VStack>

                                        <Divider borderColor="whiteAlpha.200" />

                                        <HStack justify="space-between">
                                            <Text color="white" fontSize="lg" fontWeight="bold">Total</Text>
                                            <Text color="white" fontSize="lg" fontWeight="bold">
                                                ${getCartTotal().toFixed(2)}
                                            </Text>
                                        </HStack>

                                        <Button
                                            colorScheme="blue"
                                            size="lg"
                                            onClick={processPayment}
                                            isLoading={isProcessing}
                                            loadingText="Processing Payment"
                                        >
                                            Pay Now
                                        </Button>
                                    </VStack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </Container>
                </Box>
            </Box>
        </>
    );
} 