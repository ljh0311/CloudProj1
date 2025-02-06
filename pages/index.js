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
                            Vintage Streetwear for Singapore's Youth
                        </Text>
                        <Text fontSize="md" color="whiteAlpha.600" maxW="600px" mx="auto" mb={8}>
                            Curated vintage pieces that combine bold style with breathable comfort,
                            perfect for Singapore's climate and contemporary street culture.
                        </Text>
                        <Button
                            size="lg"
                            bg="white"
                            color="black"
                            _hover={{ bg: 'whiteAlpha.800' }}
                            px={8}
                        >
                            Shop Now
                        </Button>
                    </Box>

                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
                        <Box p={6} borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="lg">
                            <VStack align="start" spacing={4}>
                                <Text fontSize="xl" fontWeight="bold">Vintage Collection</Text>
                                <Text color="whiteAlpha.800">
                                    Carefully selected vintage streetwear pieces that combine style with comfort.
                                    Each piece tells a unique story.
                                </Text>
                            </VStack>
                        </Box>
                        <Box p={6} borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="lg">
                            <VStack align="start" spacing={4}>
                                <Text fontSize="xl" fontWeight="bold">Style Guide</Text>
                                <Text color="whiteAlpha.800">
                                    Tips and inspiration for styling vintage streetwear in Singapore's
                                    hot and humid climate.
                                </Text>
                            </VStack>
                        </Box>
                    </SimpleGrid>
                </Container>
            </Box>
        </>
    );
} 