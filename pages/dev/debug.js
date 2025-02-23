import {
    Box,
    Container,
    Heading,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    Button,
    useToast,
    Code,
    Flex,
    Spacer,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Input,
    FormControl,
    FormLabel,
    VStack,
    HStack,
    Collapse,
    useDisclosure,
    Spinner,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Head from 'next/head';
import Navbar from '../../components/Navbar';

// Script Runner Component
const ScriptRunner = () => {
    const [scriptStatus, setScriptStatus] = useState({});
    const [scriptOutput, setScriptOutput] = useState({});
    const [isRunning, setIsRunning] = useState(false);
    const toast = useToast();

    const scripts = [
        {
            category: 'Database Management',
            scripts: [
                {
                    name: 'Migrate Database',
                    id: 'migrate-db',
                    description: 'Initialize or update database schema',
                    script: 'migrate-db.js',
                    color: 'blue'
                },
                {
                    name: 'Hash Passwords',
                    id: 'hash-passwords',
                    description: 'Update password hashes in the database',
                    script: 'hash-passwords.js',
                    color: 'orange'
                }
            ]
        },
        {
            category: 'Deployment',
            scripts: [
                {
                    name: 'Update IP Configuration',
                    id: 'update-ip',
                    description: 'Update IP configurations for EC2 deployment',
                    script: 'update-ip.js',
                    color: 'cyan'
                },
                {
                    name: 'Check Deployment',
                    id: 'check-deployment',
                    description: 'Run diagnostics on AWS deployment configuration',
                    script: 'check-deployment.js',
                    color: 'yellow'
                }
            ]
        }
    ];

    const runScript = async (scriptName) => {
        setIsRunning(true);
        setScriptStatus(prev => ({ ...prev, [scriptName]: 'running' }));
        setScriptOutput(prev => ({ ...prev, [scriptName]: '' }));

        try {
            const response = await fetch('/api/dev/run-script', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ script: scriptName }),
            });

            const data = await response.json();

            if (response.ok) {
                setScriptStatus(prev => ({ ...prev, [scriptName]: 'success' }));
                setScriptOutput(prev => ({ ...prev, [scriptName]: data.output }));
                toast({
                    title: "Script executed successfully",
                    description: data.message,
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                });
            } else {
                setScriptStatus(prev => ({ ...prev, [scriptName]: 'error' }));
                setScriptOutput(prev => ({ ...prev, [scriptName]: data.error }));
                toast({
                    title: "Script execution failed",
                    description: data.error,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.error('Error running script:', error);
            setScriptStatus(prev => ({ ...prev, [scriptName]: 'error' }));
            setScriptOutput(prev => ({ ...prev, [scriptName]: error.message }));
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsRunning(false);
        }
    };

    const ScriptCard = ({ script }) => {
        const { isOpen, onToggle } = useDisclosure();
        const hasOutput = scriptOutput[script.script];

        return (
            <Box
                p={4}
                borderWidth="1px"
                borderRadius="lg"
                bg="gray.700"
                _hover={{ borderColor: `${script.color}.400` }}
                transition="all 0.2s"
            >
                <VStack align="stretch" spacing={4}>
                    <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                            <HStack>
                                <Text fontWeight="bold" color="white">{script.name}</Text>
                                {scriptStatus[script.script] && (
                                    <Badge
                                        colorScheme={
                                            scriptStatus[script.script] === 'success'
                                                ? 'green'
                                                : scriptStatus[script.script] === 'error'
                                                    ? 'red'
                                                    : 'yellow'
                                        }
                                    >
                                        {scriptStatus[script.script]}
                                    </Badge>
                                )}
                            </HStack>
                            <Text fontSize="sm" color="gray.400">
                                {script.description}
                            </Text>
                        </VStack>
                        <HStack>
                            {hasOutput && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    color="gray.300"
                                    onClick={onToggle}
                                >
                                    {isOpen ? 'Hide Output' : 'Show Output'}
                                </Button>
                            )}
                            <Button
                                colorScheme={script.color}
                                size="sm"
                                isLoading={isRunning && scriptStatus[script.script] === 'running'}
                                onClick={() => runScript(script.script)}
                                leftIcon={<Text>▶</Text>}
                            >
                                Run Script
                            </Button>
                        </HStack>
                    </HStack>

                    <Collapse in={isOpen}>
                        {hasOutput && (
                            <Box
                                mt={2}
                                p={3}
                                bg="gray.800"
                                borderRadius="md"
                                borderWidth="1px"
                                borderColor="gray.600"
                            >
                                <Code display="block" whiteSpace="pre-wrap" bg="transparent" color="gray.300">
                                    {scriptOutput[script.script]}
                                </Code>
                            </Box>
                        )}
                    </Collapse>
                </VStack>
            </Box>
        );
    };

    return (
        <VStack spacing={6} align="stretch">
            <HStack justify="space-between" mb={4}>
                <Text fontSize="lg" fontWeight="bold" color="black">
                    Development Scripts
                </Text>
                <Button
                    size="sm"
                    variant="outline"
                    colorScheme="blue"
                    isDisabled={isRunning}
                    onClick={() => {
                        setScriptStatus({});
                        setScriptOutput({});
                    }}
                >
                    Clear All Results
                </Button>
            </HStack>

            {scripts.map((category) => (
                <Box key={category.category}>
                    <Text
                        color="white"
                        fontSize="md"
                        fontWeight="bold"
                        mb={3}
                        borderBottom="1px"
                        borderColor="whiteAlpha.200"
                        pb={2}
                    >
                        {category.category}
                    </Text>
                    <VStack spacing={4} align="stretch" mb={6}>
                        {category.scripts.map((script) => (
                            <ScriptCard key={script.id} script={script} />
                        ))}
                    </VStack>
                </Box>
            ))}
        </VStack>
    );
};

// Database Debugger Component
const DatabaseDebugger = () => {
    const [debugInfo, setDebugInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        fetchDebugInfo();
    }, []);

    const fetchDebugInfo = async () => {
        try {
            const response = await fetch('/api/dev/debug-info');
            const data = await response.json();
            setDebugInfo(data);
        } catch (error) {
            toast({
                title: 'Error fetching debug info',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <Spinner />;
    }

    return (
        <VStack spacing={4} align="stretch">
            <Box
                p={4}
                borderWidth="1px"
                borderRadius="lg"
                bg="gray.700"
                _hover={{ borderColor: 'blue.400' }}
            >
                <VStack align="stretch" spacing={3}>
                    <Heading size="md" color="white">Database Configuration</Heading>
                    <HStack>
                        <Badge colorScheme={debugInfo?.connected ? 'green' : 'red'}>
                            {debugInfo?.connected ? 'Connected' : 'Disconnected'}
                        </Badge>
                        <Badge colorScheme="blue">
                            {debugInfo?.database || 'Unknown Database'}
                        </Badge>
                    </HStack>

                    <Box>
                        <Text color="gray.300" fontSize="sm">Host:</Text>
                        <Code>{debugInfo?.host || 'Not configured'}</Code>
                    </Box>

                    <Box>
                        <Text color="gray.300" fontSize="sm">User:</Text>
                        <Code>{debugInfo?.user || 'Not configured'}</Code>
                    </Box>

                    <Box>
                        <Text color="gray.300" fontSize="sm">Connection Pool:</Text>
                        <HStack>
                            <Badge colorScheme="purple">
                                Limit: {debugInfo?.connectionLimit || 'N/A'}
                            </Badge>
                            <Badge colorScheme="orange">
                                Queue: {debugInfo?.queueLimit || 'N/A'}
                            </Badge>
                        </HStack>
                    </Box>

                    {debugInfo?.error && (
                        <Alert status="error">
                            <AlertIcon />
                            <Box>
                                <AlertTitle>Connection Error</AlertTitle>
                                <AlertDescription>
                                    {debugInfo.error}
                                </AlertDescription>
                            </Box>
                        </Alert>
                    )}
                </VStack>
            </Box>
        </VStack>
    );
};

// Auth Testing Component
const AuthTester = () => {
    const [authTest, setAuthTest] = useState({
        email: '',
        password: '',
        loading: false,
        result: null,
        envConfig: null
    });
    const toast = useToast();

    const testAuth = async () => {
        try {
            setAuthTest(prev => ({ ...prev, loading: true, result: null }));

            // Check environment configuration
            const configResponse = await fetch('/api/dev/auth-config');
            const configResult = await configResponse.json();
            setAuthTest(prev => ({ ...prev, envConfig: configResult }));

            // Test authentication
            const result = await signIn('credentials', {
                redirect: false,
                email: authTest.email,
                password: authTest.password
            });

            setAuthTest(prev => ({
                ...prev,
                result: {
                    success: !result.error,
                    error: result.error,
                    timestamp: new Date().toISOString()
                }
            }));

        } catch (error) {
            setAuthTest(prev => ({
                ...prev,
                result: {
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                }
            }));
        } finally {
            setAuthTest(prev => ({ ...prev, loading: false }));
        }
    };

    return (
        <Box bg="white" p={6} borderRadius="lg">
            <VStack spacing={4} align="stretch">
                <FormControl>
                    <FormLabel>Test Email</FormLabel>
                    <Input
                        value={authTest.email}
                        onChange={(e) => setAuthTest(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter test email"
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Test Password</FormLabel>
                    <Input
                        type="password"
                        value={authTest.password}
                        onChange={(e) => setAuthTest(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter test password"
                    />
                </FormControl>

                <Button
                    colorScheme="blue"
                    onClick={testAuth}
                    isLoading={authTest.loading}
                >
                    Test Authentication
                </Button>

                {authTest.envConfig && (
                    <Alert status="info">
                        <AlertIcon />
                        <Box>
                            <AlertTitle>Environment Configuration</AlertTitle>
                            <AlertDescription>
                                <Code display="block" whiteSpace="pre" mt={2}>
                                    NEXTAUTH_URL: {authTest.envConfig.NEXTAUTH_URL}
                                    <br />
                                    NEXT_PUBLIC_API_URL: {authTest.envConfig.NEXT_PUBLIC_API_URL}
                                    <br />
                                    Current Instance IP: {authTest.envConfig.instanceIP}
                                </Code>
                            </AlertDescription>
                        </Box>
                    </Alert>
                )}

                {authTest.result && (
                    <Alert
                        status={authTest.result.success ? "success" : "error"}
                    >
                        <AlertIcon />
                        <Box>
                            <AlertTitle>
                                {authTest.result.success ? "Authentication Successful" : "Authentication Failed"}
                            </AlertTitle>
                            <AlertDescription>
                                <Text>Timestamp: {authTest.result.timestamp}</Text>
                                {authTest.result.error && (
                                    <Text color="red.500">Error: {authTest.result.error}</Text>
                                )}
                            </AlertDescription>
                        </Box>
                    </Alert>
                )}
            </VStack>
        </Box>
    );
};

export default function DevDashboard() {
    return (
        <>
            <Head>
                <title>Debug Dashboard | KAPPY</title>
                <meta name="description" content="Developer debug dashboard for database inspection and system diagnostics" />
            </Head>

            <Box minH="100vh" bg="gray.900">
                <Navbar />
                <Container maxW="container.xl" py={8}>
                    <Heading color="white" mb={8}>Debug Dashboard</Heading>

                    <Box bg="gray.800" p={6} borderRadius="lg" boxShadow="xl">
                        <Tabs variant="enclosed" colorScheme="blue">
                            <TabList>
                                <Tab color="white" _selected={{ color: "blue.500", bg: "white" }}>Database Debug</Tab>
                                <Tab color="white" _selected={{ color: "blue.500", bg: "white" }}>Scripts</Tab>
                                <Tab color="white" _selected={{ color: "blue.500", bg: "white" }}>Auth Testing</Tab>
                            </TabList>

                            <TabPanels bg="white" borderRadius="lg" mt={4}>
                                <TabPanel>
                                    <DatabaseDebugger />
                                </TabPanel>
                                <TabPanel>
                                    <ScriptRunner />
                                </TabPanel>
                                <TabPanel>
                                    <AuthTester />
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </Box>
                </Container>
            </Box>
        </>
    );
}

export async function getServerSideProps(context) {
    return {
        props: {}
    };
} 