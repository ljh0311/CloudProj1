import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    Progress as ChakraProgress,
    SimpleGrid,
    Badge,
    Tooltip,
    HStack,
    Divider,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Icon,
    Grid,
    Button
} from '@chakra-ui/react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';
import { useState, useEffect } from 'react';
import { FaCheckCircle, FaTools, FaClock } from 'react-icons/fa';
import { useRouter } from 'next/router';

const MotionBox = motion(Box);

// Implementation progress data
const initialFeatures = [
    {
        feature: "Homepage",
        description: "Main landing page with brand introduction and featured sections",
        details: [
            { text: "Brand showcase ✓", link: "/" },
            { text: "Hero section ✓", link: "/" },
            { text: "Feature cards ✓", link: "/" },
            { text: "Responsive design ✓", link: "/" },
            { text: "Content review ✓", link: "/" }
        ]
    },
    {
        feature: "Shop Page",
        description: "Product listing and filtering functionality",
        details: [
            { text: "Product grid ✓", link: "/shop" },
            { text: "Search functionality ✓", link: "/shop" },
            { text: "Filters ✓", link: "/shop" },
            { text: "Size availability display ✓", link: "/shop" },
            { text: "Add to cart buttons ✓", link: "/shop" },
            { text: "Toast notifications ✓", link: "/shop" },
            { text: "Backend integration ✓", link: "/shop" },
            { text: "Persistent cart storage ✓", link: "/shop" }
        ]
    },
    {
        feature: "Product Details",
        description: "Individual product view and purchase functionality",
        details: [
            { text: "Product display ✓", link: "/product/1" },
            { text: "Image gallery ✓", link: "/product/1" },
            { text: "Size selection ✓", link: "/product/1" },
            { text: "Stock tracking ✓", link: "/product/1" },
            { text: "Add to cart ✓", link: "/product/1" },
            { text: "Toast notifications ✓", link: "/product/1" },
            { text: "Dynamic routing ✓", link: "/product/1" },
            { text: "Pending: Reviews section", link: "/product/1" }
        ]
    },
    {
        feature: "Shopping Cart",
        description: "Cart functionality and checkout process",
        details: [
            { text: "Cart UI design ✓", link: "/checkout" },
            { text: "Add/Remove items ✓", link: "/checkout" },
            { text: "Price calculation ✓", link: "/checkout" },
            { text: "Local storage persistence ✓", link: "/checkout" },
            { text: "Cart count in navbar ✓", link: "/checkout" },
            { text: "Quantity management ✓", link: "/checkout" },
            { text: "Checkout process ✓", link: "/checkout" },
            { text: "Order processing ✓", link: "/checkout" },
            { text: "Database integration ✓", link: "/checkout" }
        ]
    },
    {
        feature: "Authentication",
        description: "User authentication and account management",
        details: [
            { text: "Login form ✓", link: "/profile" },
            { text: "Form validation ✓", link: "/profile" },
            { text: "Registration form ✓", link: "/profile" },
            { text: "Session management ✓", link: "/profile" },
            { text: "User profiles ✓", link: "/profile" },
            { text: "Password hashing ✓", link: "/profile" },
            { text: "Role-based access ✓", link: "/profile" },
            { text: "Protected routes ✓", link: "/profile" },
            { text: "Pending: Password recovery", link: "/profile" },
            { text: "Pending: Social login", link: "/profile" }
        ]
    },
    {
        feature: "Database & Storage",
        description: "Data persistence and management",
        details: [
            { text: "Schema design ✓", link: "/admin/dashboard" },
            { text: "Migration scripts ✓", link: "/admin/dashboard" },
            { text: "Products JSON structure ✓", link: "/admin/dashboard" },
            { text: "Users JSON structure ✓", link: "/admin/dashboard" },
            { text: "Orders JSON structure ✓", link: "/admin/dashboard" },
            { text: "Local storage implementation ✓", link: "/admin/dashboard" },
            { text: "RDS setup documentation ✓", link: "/admin/dashboard" },
            { text: "Backup system ✓", link: "/admin/dashboard" },
            { text: "Pending: RDS implementation", link: "/admin/dashboard" }
        ]
    },
    {
        feature: "Admin Dashboard",
        description: "Administrative features and management",
        details: [
            { text: "Admin authentication ✓", link: "/admin/dashboard" },
            { text: "Product management ✓", link: "/admin/dashboard" },
            { text: "User management ✓", link: "/admin/dashboard" },
            { text: "Stock management ✓", link: "/admin/dashboard" },
            { text: "Admin-only routes ✓", link: "/admin/dashboard" },
            { text: "Data visualization ✓", link: "/admin/dashboard" }
        ]
    },
    {
        feature: "Cloud Deployment",
        description: "AWS deployment and infrastructure setup",
        details: [
            { text: "EC2 setup documentation ✓", link: "/admin/dashboard" },
            { text: "RDS setup documentation ✓", link: "/admin/dashboard" },
            { text: "Environment configuration ✓", link: "/admin/dashboard" },
            { text: "Security group setup documentation ✓", link: "/admin/dashboard" },
            { text: "Backup strategy documentation ✓", link: "/admin/dashboard" },
            { text: "Monitoring setup documentation ✓", link: "/admin/dashboard" },
            { text: "Deployment scripts ✓", link: "/admin/dashboard" },
            { text: "Pending: EC2 server deployment", link: "/admin/dashboard" },
            { text: "Pending: RDS database deployment", link: "/admin/dashboard" },
            { text: "Pending: Load balancing", link: "/admin/dashboard" },
            { text: "Pending: Auto-scaling", link: "/admin/dashboard" },
            { text: "Pending: Production environment setup", link: "/admin/dashboard" }
        ]
    }
];

export default function DevelopmentProgress() {
    const [implementationProgress, setImplementationProgress] = useState([]);
    const [summary, setSummary] = useState({
        totalFeatures: 0,
        completedFeatures: 0,
        averageProgress: 0,
    });
    const router = useRouter();

    // Function to calculate progress and status
    const calculateProgress = (details) => {
        const totalItems = details.length;
        const completedItems = details.filter(item => item.text.includes('✓')).length;
        const progress = Math.round((completedItems / totalItems) * 100);
        
        let status;
        if (progress >= 90) status = "Near Completion";
        else if (progress >= 70) status = "In Progress";
        else if (progress >= 40) status = "In Development";
        else status = "Planning";

        return { progress, status };
    };

    // Update progress and calculate summary
    useEffect(() => {
        const updatedProgress = initialFeatures.map(feature => {
            const { progress, status } = calculateProgress(feature.details);
            return {
                ...feature,
                progress,
                status
            };
        });
        
        // Calculate summary statistics
        const totalFeatures = updatedProgress.length;
        const completedFeatures = updatedProgress.filter(f => f.progress >= 90).length;
        const averageProgress = Math.round(
            updatedProgress.reduce((acc, curr) => acc + curr.progress, 0) / totalFeatures
        );

        setImplementationProgress(updatedProgress);
        setSummary({ totalFeatures, completedFeatures, averageProgress });
    }, []);

    // Add this function to handle navigation
    const handleFeatureClick = (link) => {
        if (link) {
            router.push(link);
        }
    };

    return (
        <>
            <Head>
                <title>Development Progress | KAPPY</title>
                <meta name="description" content="Track the development progress of KAPPY's e-commerce platform features and implementations." />
            </Head>

            <Box position="relative" minH="100vh" bg="black" overflow="hidden">
                <AnimatedBackground />
                
                <Box position="relative" zIndex={1}>
                    <Navbar />

                    <Container maxW="container.xl" py={12}>
                        <VStack spacing={12} align="stretch">
                            {/* Header */}
                            <MotionBox
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                textAlign="center"
                            >
                                <Heading 
                                    as="h1" 
                                    size="2xl" 
                                    mb={4}
                                    bgGradient="linear(to-r, white, whiteAlpha.800)"
                                    bgClip="text"
                                >
                                    Development Progress
                                </Heading>
                                <Text 
                                    fontSize="xl" 
                                    color="whiteAlpha.900" 
                                    maxW="800px" 
                                    mx="auto"
                                    mb={8}
                                    textShadow="0 2px 4px rgba(0,0,0,0.4)"
                                >
                                    Track the development status of our e-commerce platform features
                                </Text>

                                {/* Summary Statistics */}
                                <Grid 
                                    templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }}
                                    gap={8}
                                    mb={12}
                                >
                                    <Stat
                                        bg="rgba(0, 0, 0, 0.6)"
                                        backdropFilter="blur(10px)"
                                        borderRadius="lg"
                                        p={6}
                                        borderWidth="1px"
                                        borderColor="whiteAlpha.200"
                                    >
                                        <HStack spacing={3} mb={2}>
                                            <Icon as={FaCheckCircle} color="green.400" w={6} h={6} />
                                            <StatLabel color="whiteAlpha.900">Completed Features</StatLabel>
                                        </HStack>
                                        <StatNumber color="white" fontSize="3xl">
                                            {summary.completedFeatures}/{summary.totalFeatures}
                                        </StatNumber>
                                        <StatHelpText color="whiteAlpha.800">
                                            Features near completion
                                        </StatHelpText>
                                    </Stat>

                                    <Stat
                                        bg="rgba(0, 0, 0, 0.6)"
                                        backdropFilter="blur(10px)"
                                        borderRadius="lg"
                                        p={6}
                                        borderWidth="1px"
                                        borderColor="whiteAlpha.200"
                                    >
                                        <HStack spacing={3} mb={2}>
                                            <Icon as={FaTools} color="yellow.400" w={6} h={6} />
                                            <StatLabel color="whiteAlpha.900">Average Progress</StatLabel>
                                        </HStack>
                                        <StatNumber color="white" fontSize="3xl">
                                            {summary.averageProgress}%
                                        </StatNumber>
                                        <StatHelpText color="whiteAlpha.800">
                                            Overall completion rate
                                        </StatHelpText>
                                    </Stat>

                                    <Stat
                                        bg="rgba(0, 0, 0, 0.6)"
                                        backdropFilter="blur(10px)"
                                        borderRadius="lg"
                                        p={6}
                                        borderWidth="1px"
                                        borderColor="whiteAlpha.200"
                                    >
                                        <HStack spacing={3} mb={2}>
                                            <Icon as={FaClock} color="blue.400" w={6} h={6} />
                                            <StatLabel color="whiteAlpha.900">Time Estimate</StatLabel>
                                        </HStack>
                                        <StatNumber color="white" fontSize="3xl">
                                            {Math.ceil((100 - summary.averageProgress) / 20)} weeks
                                        </StatNumber>
                                        <StatHelpText color="whiteAlpha.800">
                                            Until completion
                                        </StatHelpText>
                                    </Stat>
                                </Grid>

                                <Divider borderColor="whiteAlpha.200" mb={12} />
                            </MotionBox>

                            {/* Progress Grid */}
                            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
                                {implementationProgress.map((feature, index) => (
                                    <MotionBox
                                        key={index}
                                        p={8}
                                        borderWidth="1px"
                                        borderColor="whiteAlpha.200"
                                        borderRadius="lg"
                                        bg="rgba(0, 0, 0, 0.6)"
                                        backdropFilter="blur(10px)"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        whileHover={{ 
                                            y: -5, 
                                            boxShadow: "0 20px 30px -10px rgba(0,0,0,0.4)",
                                            borderColor: "rgba(255, 255, 255, 0.4)"
                                        }}
                                    >
                                        <VStack align="stretch" spacing={6}>
                                            <HStack justify="space-between" align="center">
                                                <Heading size="md" color="white">
                                                    {feature.feature}
                                                </Heading>
                                                <Badge
                                                    colorScheme={
                                                        feature.status === "Near Completion"
                                                            ? "green"
                                                            : feature.status === "In Progress"
                                                            ? "yellow"
                                                            : feature.status === "In Development"
                                                            ? "orange"
                                                            : "red"
                                                    }
                                                    px={3}
                                                    py={1}
                                                    borderRadius="full"
                                                >
                                                    {feature.status}
                                                </Badge>
                                            </HStack>
                                            
                                            <Text color="whiteAlpha.800" fontSize="md">
                                                {feature.description}
                                            </Text>

                                            <Box>
                                                <Tooltip 
                                                    label={`${feature.progress}% complete`}
                                                    hasArrow
                                                    placement="top"
                                                >
                                                    <ChakraProgress 
                                                        value={feature.progress} 
                                                        colorScheme={
                                                            feature.progress >= 90
                                                                ? "green"
                                                                : feature.progress >= 70
                                                                ? "yellow"
                                                                : feature.progress >= 40
                                                                ? "orange"
                                                                : "red"
                                                        }
                                                        borderRadius="full"
                                                        bg="whiteAlpha.200"
                                                        height="8px"
                                                    />
                                                </Tooltip>
                                            </Box>

                                            <VStack align="stretch" spacing={2}>
                                                {feature.details.map((detail, idx) => (
                                                    <Button
                                                        key={idx}
                                                        variant="ghost"
                                                        justifyContent="flex-start"
                                                        color="whiteAlpha.900"
                                                        onClick={() => handleFeatureClick(detail.link)}
                                                        leftIcon={detail.text.includes('✓') ? <FaCheckCircle color="green" /> : detail.text.includes('Pending') ? <FaClock color="orange" /> : <FaTools color="yellow" />}
                                                        _hover={{
                                                            bg: "whiteAlpha.200",
                                                            transform: "translateX(5px)"
                                                        }}
                                                        transition="all 0.2s"
                                                    >
                                                        {detail.text}
                                                    </Button>
                                                ))}
                                            </VStack>
                                        </VStack>
                                    </MotionBox>
                                ))}
                            </SimpleGrid>
                        </VStack>
                    </Container>
                </Box>
            </Box>
        </>
    );
} 