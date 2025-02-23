import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    Button,
    Icon,
    useColorModeValue,
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function OrderSuccess() {
    const router = useRouter();
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            router.push('/auth?returnUrl=/order-success');
        },
    });

    useEffect(() => {
        // If user navigates directly to this page without a recent order,
        // redirect them to the orders page
        const hasRecentOrder = sessionStorage.getItem('recentOrder');
        if (!hasRecentOrder) {
            router.push('/orders');
        }
    }, [router]);

    if (status === 'loading') {
        return null;
    }

    return (
        <>
            <Head>
                <title>Order Confirmed | KAPPY</title>
                <meta name="description" content="Your order has been successfully placed" />
            </Head>

            <Box position="relative" minH="100vh" bg="black" overflow="hidden">
                <AnimatedBackground />
                
                <Box position="relative" zIndex={1}>
                    <Navbar />

                    <Container maxW="container.md" py={20}>
                        <VStack
                            spacing={8}
                            bg="rgba(0, 0, 0, 0.6)"
                            backdropFilter="blur(10px)"
                            borderWidth="1px"
                            borderColor="whiteAlpha.200"
                            borderRadius="xl"
                            p={8}
                            align="center"
                        >
                            <Icon
                                as={CheckCircleIcon}
                                w={20}
                                h={20}
                                color="green.400"
                            />

                            <Heading
                                color="white"
                                size="xl"
                                textAlign="center"
                            >
                                Thank You for Your Order!
                            </Heading>

                            <Text
                                color="whiteAlpha.900"
                                fontSize="lg"
                                textAlign="center"
                            >
                                Your order has been successfully placed and will be processed shortly.
                                We&apos;ll send you an email with your order details and tracking information.
                            </Text>

                            <VStack spacing={4} mt={4}>
                                <Button
                                    colorScheme="blue"
                                    size="lg"
                                    onClick={() => router.push('/orders')}
                                    w="full"
                                >
                                    View My Orders
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    colorScheme="blue"
                                    size="lg"
                                    onClick={() => router.push('/shop')}
                                    w="full"
                                >
                                    Continue Shopping
                                </Button>
                            </VStack>
                        </VStack>
                    </Container>
                </Box>
            </Box>
        </>
    );
} 