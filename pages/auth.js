import { Box, Container, Flex } from '@chakra-ui/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import AuthForm from '../components/AuthForm';
import AnimatedBackground from '../components/AnimatedBackground';

export default function Auth() {
  const router = useRouter();
  const { mode } = router.query;

  return (
    <>
      <Head>
        <title>{mode === 'signup' ? 'Create Account' : 'Sign In'} | KAPPY</title>
        <meta name="description" content="Join KAPPY - Sign in or create an account to access exclusive vintage streetwear." />
      </Head>

      <Navbar />

      <Box
        as="main"
        bg="black"
        color="white"
        minH="calc(100vh - 60px)"
        position="relative"
        overflow="hidden"
      >
        <AnimatedBackground />

        <Box
          position="relative"
          zIndex="1"
          backdropFilter="blur(5px)"
          py={20}
        >
          <Container maxW="container.xl">
            <Flex
              direction="column"
              align="center"
              justify="center"
              minH="60vh"
            >
              <AuthForm mode={mode === 'signup' ? 'signup' : 'login'} />
            </Flex>
          </Container>
        </Box>
      </Box>
    </>
  );
} 