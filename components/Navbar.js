// Chakra UI Components
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

// Icons and Third-party Components
import { HamburgerIcon, CloseIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { FaShoppingCart, FaUser } from 'react-icons/fa';
import NextLink from 'next/link';
import { useSession, signOut } from 'next-auth/react';

// Custom Components and Hooks
import Logo from './Logo';
import { useCart } from './CartContext';
import { useState } from 'react';

/**
 * Navigation link component with consistent styling
 * @param {Object} props
 * @param {string} props.href - The link destination
 * @param {React.ReactNode} props.children - The link content
 * @param {React.ReactNode} props.icon - Optional icon to display before the text
 */
const NavLink = ({ href, children, icon }) => (
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
        display="flex"
        alignItems="center"
      >
        {icon && <Text as="span" mr={2}>{icon}</Text>}
        {children}
      </Text>
    </LinkOverlay>
  </LinkBox>
);

/**
 * Component to display user login status
 * @param {Object} props
 * @param {Object} props.session - The user session object
 */
const LoginStatus = ({ session }) => (
  <Text
    color="whiteAlpha.900"
    fontSize="sm"
    px={4}
    py={2}
    bg="whiteAlpha.100"
    rounded="full"
    display={{ base: 'none', md: 'block' }}
  >
    {session ? (
      <HStack spacing={2}>
        <Box as="span" color="green.300">●</Box>
        <Text>Logged in as {session.user.name}</Text>
      </HStack>
    ) : (
      <HStack spacing={2}>
        <Box as="span" color="red.300">●</Box>
        <Text>Not logged in</Text>
      </HStack>
    )}
  </Text>
);

/**
 * Menu item component for user dropdown
 * @param {Object} props
 * @param {string} props.href - Optional link destination
 * @param {React.ReactNode} props.icon - Icon to display
 * @param {string} props.label - Menu item text
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.color - Text color
 * @param {string} props.hoverBg - Background color on hover
 */
const UserMenuItem = ({ href, icon, label, onClick, color = "white", hoverBg = "gray.700" }) => (
  <MenuItem
    as={href ? NextLink : undefined}
    href={href}
    onClick={onClick}
    bg="gray.800"
    _hover={{ bg: hoverBg }}
    _focus={{ bg: hoverBg }}
    _active={{ bg: hoverBg === "gray.700" ? "gray.600" : hoverBg }}
  >
    <HStack>
      {typeof icon === 'string' ? (
        <Box as="span" mr={2}>{icon}</Box>
      ) : (
        icon
      )}
      <Text color={color}>{label}</Text>
    </HStack>
  </MenuItem>
);

/**
 * Cart button component with item count badge
 * @param {Object} props
 * @param {number} props.cartItemCount - Number of items in cart
 */
const CartButton = ({ cartItemCount }) => (
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
);

/**
 * User menu dropdown component
 * @param {Object} props
 * @param {Object} props.session - The user session object
 * @param {boolean} props.isAdmin - Whether the user has admin privileges
 */
const UserMenu = ({ session, isAdmin }) => (
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
      <UserMenuItem
        href="/profile"
        icon={<FaUser />}
        label="Profile"
      />
      <UserMenuItem
        href="/orders"
        icon="📦"
        label="Orders"
      />
      {isAdmin && (
        <>
          <MenuDivider borderColor="whiteAlpha.300" />
          <UserMenuItem
            href="/admin/dashboard"
            icon="⚙️"
            label="Admin Dashboard"
          />
          <UserMenuItem
            href="/dev/debug"
            icon="🛠️"
            label="Debug Tools"
          />
        </>
      )}
      <MenuDivider borderColor="whiteAlpha.300" />
      <UserMenuItem
        onClick={() => signOut()}
        icon="🚪"
        label="Sign Out"
        color="red.300"
        hoverBg="red.900"
      />
    </MenuList>
  </Menu>
);

// Mobile navigation component
const MobileNav = ({ isOpen, links }) => (
  <Collapse in={isOpen} animateOpacity>
    <Stack
      py={4}
      spacing={4}
      display={{ md: 'none' }}
    >
      {links.map((link) => (
        <NavLink key={link.href} href={link.href}>
          {link.icon && <Text as="span" mr={2}>{link.icon}</Text>}
          {link.label}
        </NavLink>
      ))}
    </Stack>
  </Collapse>
);

// Define dev tools button separately
const DevToolsButton = ({ isAdmin }) => {
  if (!isAdmin) return null;
  return (
    <Button
      as={NextLink}
      href="/dev/debug"
      variant="ghost"
      color="white"
      leftIcon={<Text fontSize="lg">🛠️</Text>}
      _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
      size="sm"
    >
      Debug Tools
    </Button>
  );
};

/**
 * Main navigation bar component for the application.
 * Provides navigation links, user authentication, and cart functionality.
 */
export default function Navbar() {
  const { isOpen, onToggle } = useDisclosure();
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const { getCartCount } = useCart();
  const { data: session, status } = useSession();
  const cartItemCount = getCartCount();
  const isAdmin = session?.user?.role === 'admin';

  // Define navigation links
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/about", label: "About" }
  ];

  // Add admin-specific links if user is admin
  const mobileNavLinks = [
    ...navLinks,
    ...(isAdmin ? [
      { href: "/dev/debug", label: "Debug Tools 🛠️" },
      { href: "/admin/dashboard", label: "Admin Dashboard ⚙️" }
    ] : []),
    { href: "/cart", label: `Cart ${cartItemCount > 0 ? `(${cartItemCount})` : ''}` },
    ...(session
      ? [
        { href: "/profile", label: "Profile" },
        { href: "/orders", label: "Orders" },
      ]
      : [
        { href: "/auth", label: "Sign In" },
        { href: "/auth?mode=signup", label: "Sign Up" }
      ]
    )
  ];

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
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {link.icon && <Text as="span" mr={2}>{link.icon}</Text>}
                {link.label}
              </NavLink>
            ))}
          </HStack>

          {/* Login Status and Auth Buttons */}
          <HStack
            spacing={4}
            display={{ base: 'none', md: 'flex' }}
          >
            {isAdmin && (
              <>
                <DevToolsButton isAdmin={isAdmin} />
                <Button
                  as={NextLink}
                  href="/admin/dashboard"
                  variant="ghost"
                  color="white"
                  leftIcon={<Text fontSize="lg">⚙️</Text>}
                  _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                  size="sm"
                >
                  Admin
                </Button>
              </>
            )}
            <LoginStatus session={session} />
            {session ? (
              <>
                <CartButton cartItemCount={cartItemCount} />
                <UserMenu session={session} isAdmin={isAdmin} />
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
        <MobileNav isOpen={isOpen} links={mobileNavLinks} />
      </Container>
    </Box>
  );
} 