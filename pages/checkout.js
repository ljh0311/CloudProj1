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
    Spinner,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
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
    if (!number) return { type: '', color: 'gray' };
    
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

// Generate unique order number
const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${timestamp}-${random}`;
};

export default function Checkout() {
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            router.push('/auth?returnUrl=/checkout');
        },
    });
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
    const [orderSummary, setOrderSummary] = useState({
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0
    });
    const [error, setError] = useState('');

    // Calculate order summary on cart changes
    useEffect(() => {
        const subtotal = getCartTotal();
        const tax = parseFloat((subtotal * 0.07).toFixed(2)); // 7% tax
        const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
        const total = parseFloat((subtotal + tax + shipping).toFixed(2));

        setOrderSummary({
            subtotal,
            tax,
            shipping,
            total
        });
    }, [cartItems, getCartTotal]);

    // Redirect if cart is empty
    useEffect(() => {
        if (cartItems.length === 0 && status !== 'loading') {
            router.push('/cart');
        }
    }, [cartItems.length, status, router]);

    if (status === 'loading') {
        return (
            <Box height="100vh" display="flex" alignItems="center" justifyContent="center">
                <Spinner size="xl" color="blue.500" />
            </Box>
        );
    }

    if (!session || cartItems.length === 0) {
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
        } else if (!/^[a-zA-Z\s]+$/.test(paymentData.cardHolder)) {
            newErrors.cardHolder = 'Name should only contain letters and spaces';
        }

        // Expiry date validation
        const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
        if (!paymentData.expiryDate || !expiryRegex.test(paymentData.expiryDate)) {
            newErrors.expiryDate = 'Invalid expiry date (MM/YY)';
        } else {
            const [month, year] = paymentData.expiryDate.split('/');
            const expiry = new Date(2000 + parseInt(year), parseInt(month));
            const today = new Date();
            today.setDate(1); // Set to first of month for accurate month comparison
            
            if (expiry < today) {
                newErrors.expiryDate = 'Card has expired';
            }
        }

        // CVV validation
        if (!paymentData.cvv || !/^[0-9]{3,4}$/.test(paymentData.cvv)) {
            newErrors.cvv = 'Invalid CVV';
        } else {
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

        // Format cardholder name
        if (name === 'cardHolder') {
            formattedValue = value.replace(/[^a-zA-Z\s]/g, '');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setError('');

        try {
            // Check stock availability first
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
            console.log('Making request to:', `${baseUrl}/api/products/check-stock`);
            const stockCheckResponse = await fetch(`${baseUrl}/api/products/check-stock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: cartItems.map(item => ({
                        product_id: item.product_id,
                        size: item.size,
                        quantity: item.quantity
                    }))
                })
            });

            if (!stockCheckResponse.ok) {
                throw new Error(`Stock check failed: ${stockCheckResponse.status} ${stockCheckResponse.statusText}`);
            }

            const stockCheckData = await stockCheckResponse.json();
            if (!stockCheckData.success) {
                setError(stockCheckData.message);
                setIsProcessing(false);
                return;
            }

            // Proceed with order creation
            console.log('Making request to:', `${baseUrl}/api/orders/create`);
            const response = await fetch(`${baseUrl}/api/orders/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: cartItems.map(item => ({
                        product_id: item.product_id,
                        size: item.size,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    shipping_address: {
                        name: paymentData.cardHolder,
                        address: 'Default Address', // You may want to add address fields to your form
                        city: 'Default City',
                        state: 'Default State',
                        postal_code: '12345'
                    },
                    payment: {
                        cardholder_name: paymentData.cardHolder,
                        card_last4: paymentData.cardNumber.slice(-4),
                        expiry_date: paymentData.expiryDate,
                        amount: getCartTotal()
                    },
                    subtotal: getCartTotal(),
                    tax: getCartTotal() * 0.07,
                    shipping: 5.00,
                    total: getCartTotal() * 1.07 + 5.00
                })
            });

            const data = await response.json();
            if (!data.success) {
                setError(data.message || 'Failed to create order');
                setIsProcessing(false);
                return;
            }

            // Clear cart and redirect to success page
            clearCart();
            router.push('/order-success');

        } catch (error) {
            console.error('Checkout error:', error);
            setError('An error occurred during checkout. Please try again.');
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
                        {orderSummary.total > 0 && (
                            <Alert status="info" mb={6} borderRadius="md">
                                <AlertIcon />
                                <Box>
                                    <AlertTitle>Free Shipping Available!</AlertTitle>
                                    <AlertDescription>
                                        {orderSummary.total >= 100 
                                            ? 'You\'ve qualified for free shipping!'
                                            : `Spend $${(100 - orderSummary.subtotal).toFixed(2)} more to get free shipping!`
                                        }
                                    </AlertDescription>
                                </Box>
                            </Alert>
                        )}

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
                                                    disabled={isProcessing}
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
                                                disabled={isProcessing}
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
                                                    disabled={isProcessing}
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
                                                    disabled={isProcessing}
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
                                                <HStack key={`${item.id}-${item.size}`} justify="space-between">
                                                    <HStack spacing={4}>
                                                        <Box
                                                            width="50px"
                                                            height="50px"
                                                            borderRadius="md"
                                                            overflow="hidden"
                                                        >
                                                            {item.image && (
                                                                <Image
                                                                    src={item.image}
                                                                    alt={item.name}
                                                                    width={50}
                                                                    height={50}
                                                                    objectFit="cover"
                                                                />
                                                            )}
                                                        </Box>
                                                        <VStack align="start" spacing={0}>
                                                            <Text color="white">{item.name}</Text>
                                                            <HStack>
                                                                <Badge colorScheme="purple">Size {item.size}</Badge>
                                                                <Text color="whiteAlpha.600">x{item.quantity}</Text>
                                                            </HStack>
                                                        </VStack>
                                                    </HStack>
                                                    <Text color="white">${(item.price * item.quantity).toFixed(2)}</Text>
                                                </HStack>
                                            ))}
                                        </VStack>

                                        <Divider borderColor="whiteAlpha.200" />

                                        <VStack spacing={2}>
                                            <HStack justify="space-between" width="100%">
                                                <Text color="whiteAlpha.800">Subtotal</Text>
                                                <Text color="white">${orderSummary.subtotal.toFixed(2)}</Text>
                                            </HStack>
                                            <HStack justify="space-between" width="100%">
                                                <Text color="whiteAlpha.800">Tax (7%)</Text>
                                                <Text color="white">${orderSummary.tax.toFixed(2)}</Text>
                                            </HStack>
                                            <HStack justify="space-between" width="100%">
                                                <Text color="whiteAlpha.800">Shipping</Text>
                                                <Text color="white">
                                                    {orderSummary.shipping === 0 ? 'FREE' : `$${orderSummary.shipping.toFixed(2)}`}
                                                </Text>
                                            </HStack>
                                            <Divider borderColor="whiteAlpha.200" />
                                            <HStack justify="space-between" width="100%">
                                                <Text color="white" fontSize="lg" fontWeight="bold">Total</Text>
                                                <Text color="white" fontSize="lg" fontWeight="bold">
                                                    ${orderSummary.total.toFixed(2)}
                                                </Text>
                                            </HStack>
                                        </VStack>

                                        <Button
                                            colorScheme="blue"
                                            size="lg"
                                            onClick={handleSubmit}
                                            isLoading={isProcessing}
                                            loadingText="Processing Payment"
                                            disabled={isProcessing}
                                        >
                                            Pay Now
                                        </Button>

                                        <Text color="whiteAlpha.600" fontSize="sm" textAlign="center">
                                            By clicking &quot;Pay Now&quot;, you agree to our terms of service and privacy policy.
                                        </Text>
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