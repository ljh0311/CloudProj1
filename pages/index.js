import { Box, Container, Heading, SimpleGrid, Text, Button, VStack } from '@chakra-ui/react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';

export default function Home() {
    return (
        <>
            <Head>
                <title>KAPPY - Vintage Streetwear Singapore</title>
                <meta name="description" content="KAPPY - Vintage streetwear curated for Singapore's youth and climate. Bold designs that keep you cool." />
            </Head>

            <Navbar />

            <Box as="main" bg="black" color="white" minH="100vh">
                <Container maxW="container.xl" py={12}>
                    <Box textAlign="center" mb={16}>
                        <Logo size="120px" />
                        <Heading as="h1" size="2xl" mb={4} mt={6}>
                            KAPPY
                        </Heading>
                        <Text fontSize="xl" color="whiteAlpha.800" mb={4}>
                            Premium Streetwear Collection
                        </Text>
                        <Text fontSize="md" color="whiteAlpha.600" maxW="600px" mx="auto" mb={8}>
                            Curated vintage pieces that combine bold style with timeless appeal.
                            Discover unique streetwear that makes a statement.
                        </Text>
                        <Button
                            size="lg"
                            bg="white"
                            color="black"
                            _hover={{ bg: 'whiteAlpha.800' }}
                            px={8}
                            onClick={() => {
                                window.location.href = '/shop';
                            }}
                        >
                            Shop Now
                        </Button>
                    </Box>

                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
                        <Box p={6} borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="lg">
                            <VStack align="start" spacing={4}>
                                <Text fontSize="xl" fontWeight="bold">Featured Products</Text>
                                <Text color="whiteAlpha.800">
                                    Browse our curated collection of high-quality products.
                                    Find something that matches your unique style.
                                </Text>
                            </VStack>
                        </Box>
                        <Box p={6} borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="lg">
                            <VStack align="start" spacing={4}>
                                <Text fontSize="xl" fontWeight="bold">Shopping Guide</Text>
                                <Text color="whiteAlpha.800">
                                    Helpful tips and recommendations to enhance
                                    your shopping experience with us.
                                </Text>
                            </VStack>
                        </Box>
                    </SimpleGrid>
                </Container>
            </Box>
        </>
    );
} 