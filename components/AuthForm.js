import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
  Link,
  Heading,
  FormErrorMessage,
  useToast,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

const MotionBox = motion(Box);

// Validation schemas
const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});

const signupSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  role: Yup.string()
    .oneOf(['customer', 'admin'], 'Invalid role')
    .required('Role is required'),
});

export default function AuthForm({ mode = 'login' }) {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const toast = useToast();

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Here you would typically make an API call to your backend
      console.log('Form values:', values);
      
      toast({
        title: isLogin ? 'Welcome back!' : 'Account created.',
        description: isLogin 
          ? 'You have successfully signed in.' 
          : 'Your account has been created successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const initialValues = isLogin 
    ? { email: '', password: '' }
    : { email: '', password: '', confirmPassword: '', role: 'customer' };

  return (
    <MotionBox
      initial="hidden"
      animate="visible"
      variants={formVariants}
      p={8}
      maxWidth="400px"
      borderWidth={1}
      borderRadius="lg"
      borderColor="whiteAlpha.200"
      bg="blackAlpha.600"
      backdropFilter="blur(10px)"
    >
      <Formik
        initialValues={initialValues}
        validationSchema={isLogin ? loginSchema : signupSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched }) => (
          <Form>
            <Stack spacing={4}>
              <Heading color="white" size="lg" textAlign="center">
                {isLogin ? 'Sign In' : 'Create Account'}
              </Heading>

              <Field name="email">
                {({ field }) => (
                  <FormControl isInvalid={errors.email && touched.email}>
                    <FormLabel color="whiteAlpha.900">Email</FormLabel>
                    <Input
                      {...field}
                      type="email"
                      bg="whiteAlpha.100"
                      borderColor="whiteAlpha.300"
                      color="white"
                      _hover={{ borderColor: 'whiteAlpha.400' }}
                      _focus={{ borderColor: 'white', boxShadow: 'none' }}
                    />
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>

              <Field name="password">
                {({ field }) => (
                  <FormControl isInvalid={errors.password && touched.password}>
                    <FormLabel color="whiteAlpha.900">Password</FormLabel>
                    <Input
                      {...field}
                      type="password"
                      bg="whiteAlpha.100"
                      borderColor="whiteAlpha.300"
                      color="white"
                      _hover={{ borderColor: 'whiteAlpha.400' }}
                      _focus={{ borderColor: 'white', boxShadow: 'none' }}
                    />
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>

              {!isLogin && (
                <>
                  <Field name="confirmPassword">
                    {({ field }) => (
                      <FormControl isInvalid={errors.confirmPassword && touched.confirmPassword}>
                        <FormLabel color="whiteAlpha.900">Confirm Password</FormLabel>
                        <Input
                          {...field}
                          type="password"
                          bg="whiteAlpha.100"
                          borderColor="whiteAlpha.300"
                          color="white"
                          _hover={{ borderColor: 'whiteAlpha.400' }}
                          _focus={{ borderColor: 'white', boxShadow: 'none' }}
                        />
                        <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>

                  <Field name="role">
                    {({ field }) => (
                      <FormControl isInvalid={errors.role && touched.role}>
                        <FormLabel color="whiteAlpha.900">Account Type</FormLabel>
                        <select
                          {...field}
                          style={{
                            width: '100%',
                            padding: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '6px',
                            color: 'white',
                          }}
                        >
                          <option value="customer" style={{ color: 'black' }}>Customer</option>
                          <option value="admin" style={{ color: 'black' }}>Store Admin</option>
                        </select>
                        <FormErrorMessage>{errors.role}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                </>
              )}

              <Button
                type="submit"
                bg="white"
                color="black"
                _hover={{ bg: 'whiteAlpha.800' }}
                size="lg"
                isLoading={isSubmitting}
                loadingText={isLogin ? 'Signing In...' : 'Creating Account...'}
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>

              <Text color="whiteAlpha.800" textAlign="center">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <Link
                  color="white"
                  textDecoration="underline"
                  onClick={() => setIsLogin(!isLogin)}
                  _hover={{ color: 'whiteAlpha.800' }}
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Link>
              </Text>
            </Stack>
          </Form>
        )}
      </Formik>
    </MotionBox>
  );
} 