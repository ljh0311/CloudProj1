import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Collapse,
  useBreakpointValue,
  useDisclosure,
  LinkBox,
  LinkOverlay,
  Container,
  HStack,
  Divider,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { FaShoppingCart, FaUser } from 'react-icons/fa';
import Logo from './Logo';
import NextLink from 'next/link';
import { useState } from 'react';
import { useCart } from './CartContext';
import { useSession, signOut } from 'next-auth/react';

const NavLink = ({ href, children }) => (
  <LinkBox>
    <LinkOverlay as={NextLink} href={href}>
      <Text
        px={4}
        py={2}
        rounded="md"
        bg="transparent"
        _hover={{
          bg: 'rgba(255, 255, 255, 0.1)',
          transform: 'translateY(-2px)'
        }}
        transition="all 0.2s"
        cursor="pointer"
        color="white"
        fontWeight="medium"
      >
        {children}
      </Text>
    </LinkOverlay>
  </LinkBox>
);

export default function Navbar() {
  const { isOpen, onToggle } = useDisclosure();
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const { getCartCount } = useCart();
  const cartItemCount = getCartCount();
  const { data: session } = useSession();
  console.log('Current session:', session);

  // Check if user is admin
  const isAdmin = session?.user?.role === 'admin';

  return (
    <Box 
      position="sticky" 
      top={0} 
      zIndex={1000}
      bg="rgba(0, 0, 0, 0.8)"
      backdropFilter="blur(10px)"
      borderBottom="1px solid"
      borderColor="rgba(255, 255, 255, 0.1)"
    >
      <Container maxW="container.xl">
        <Flex
          minH="60px"
          py={2}
          align="center"
          justify="space-between"
        >
          {/* Mobile Hamburger */}
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            onClick={onToggle}
            icon={isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />}
            variant="ghost"
            color="white"
            _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
            aria-label="Toggle Navigation"
          />

          {/* Logo */}
          <LinkBox
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
          >
            <LinkOverlay as={NextLink} href="/">
              <Flex alignItems="center" gap={3}>
                <Logo size="40px" isAnimated={isLogoHovered} />
                <Text
                  display={{ base: 'none', sm: 'block' }}
                  fontSize="xl"
                  fontWeight="bold"
                  color="white"
                  letterSpacing="wide"
                >
                  KAPPY
                </Text>
              </Flex>
            </LinkOverlay>
          </LinkBox>

          {/* Desktop Navigation */}
          <HStack
            spacing={1}
            display={{ base: 'none', md: 'flex' }}
          >
            <NavLink href="/">Home</NavLink>
            <NavLink href="/shop">Shop</NavLink>
            <NavLink href="/about">About</NavLink>
            {isAdmin && <NavLink href="/admin/dashboard">Admin Dashboard</NavLink>}
          </HStack>

          {/* Auth Buttons and Cart */}
          <HStack
            spacing={4}
            display={{ base: 'none', md: 'flex' }}
          >
            {session ? (
              <>
                {/* Cart Button */}
                <Button
                  as={NextLink}
                  href="/cart"
                  variant="ghost"
                  color="white"
                  leftIcon={<FaShoppingCart />}
                  _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                  position="relative"
                  pr={cartItemCount > 0 ? 8 : 4}
                >
                  Cart
                  {cartItemCount > 0 && (
                    <Badge
                      position="absolute"
                      top={1}
                      right={1}
                      colorScheme="red"
                      borderRadius="full"
                      px={2}
                    >
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>

                {/* User Menu */}
                <Menu>
                  <MenuButton
                    as={Button}
                    variant="ghost"
                    color="white"
                    _hover={{ bg: 'whiteAlpha.200' }}
                    _active={{ bg: 'whiteAlpha.300' }}
                    rightIcon={<ChevronDownIcon />}
                  >
                    <HStack>
                      <Avatar 
                        size="sm" 
                        name={session.user.name} 
                        src={session.user.image}
                        bg="blue.500"
                      />
                      <Text color="white">{session.user.name}</Text>
                    </HStack>
                  </MenuButton>
                  <MenuList 
                    bg="gray.800" 
                    borderColor="whiteAlpha.300"
                    boxShadow="dark-lg"
                    py={2}
                  >
                    <MenuItem 
                      as={NextLink}
                      href="/profile"
                      bg="gray.800"
                      _hover={{ bg: 'gray.700' }}
                      _focus={{ bg: 'gray.700' }}
                      _active={{ bg: 'gray.600' }}
                    >
                      <HStack>
                        <FaUser />
                        <Text color="white">Profile</Text>
                      </HStack>
                    </MenuItem>
                    <MenuItem 
                      as={NextLink}
                      href="/orders"
                      bg="gray.800"
                      _hover={{ bg: 'gray.700' }}
                      _focus={{ bg: 'gray.700' }}
                      _active={{ bg: 'gray.600' }}
                    >
                      <HStack>
                        <Box as="span" mr={2}>📦</Box>
                        <Text color="white">Orders</Text>
                      </HStack>
                    </MenuItem>
                    {isAdmin && (
                      <>
                        <MenuDivider borderColor="whiteAlpha.300" />
                        <MenuItem 
                          as={NextLink}
                          href="/admin/dashboard"
                          bg="gray.800"
                          _hover={{ bg: 'gray.700' }}
                          _focus={{ bg: 'gray.700' }}
                          _active={{ bg: 'gray.600' }}
                        >
                          <HStack>
                            <Box as="span" mr={2}>⚙️</Box>
                            <Text color="white">Admin Dashboard</Text>
                          </HStack>
                        </MenuItem>
                      </>
                    )}
                    <MenuDivider borderColor="whiteAlpha.300" />
                    <MenuItem 
                      onClick={() => signOut()}
                      bg="gray.800"
                      _hover={{ bg: 'red.900' }}
                      _focus={{ bg: 'red.900' }}
                      _active={{ bg: 'red.800' }}
                    >
                      <HStack>
                        <Box as="span" mr={2}>🚪</Box>
                        <Text color="red.300">Sign Out</Text>
                      </HStack>
                    </MenuItem>
                  </MenuList>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  as={NextLink}
                  href="/auth"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                  size="sm"
                >
                  Sign In
                </Button>
                <Button
                  as={NextLink}
                  href="/auth?mode=signup"
                  bg="white"
                  color="black"
                  _hover={{ bg: 'rgba(255, 255, 255, 0.8)' }}
                  size="sm"
                >
                  Sign Up
                </Button>
              </>
            )}
          </HStack>
        </Flex>

        {/* Mobile Navigation */}
        <Collapse in={isOpen} animateOpacity>
          <Stack
            py={4}
            spacing={4}
            display={{ md: 'none' }}
          >
            <NavLink href="/">Home</NavLink>
            <NavLink href="/shop">Shop</NavLink>
            <NavLink href="/about">About</NavLink>
            <NavLink href="/cart">Cart {cartItemCount > 0 && `(${cartItemCount})`}</NavLink>
            
            {session ? (
              <>
                <NavLink href="/profile">Profile</NavLink>
                <NavLink href="/orders">Orders</NavLink>
                {isAdmin && <NavLink href="/admin/dashboard">Admin Dashboard</NavLink>}
                <Divider borderColor="rgba(255, 255, 255, 0.1)" />
                <Button
                  onClick={() => signOut()}
                  colorScheme="red"
                  variant="ghost"
                  width="100%"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Divider borderColor="rgba(255, 255, 255, 0.1)" />
                <NavLink href="/auth">Sign In</NavLink>
                <NavLink href="/auth?mode=signup">Sign Up</NavLink>
              </>
            )}
          </Stack>
        </Collapse>
      </Container>
    </Box>
  );
} 