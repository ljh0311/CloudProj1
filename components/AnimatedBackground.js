import { Box } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const AnimatedBackground = () => {
  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex={0}
      overflow="hidden"
      pointerEvents="none"
    >
      {/* Gradient Overlay */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="linear-gradient(to bottom right, rgba(0,0,0,0.9), rgba(0,0,0,0.95))"
        backdropFilter="blur(100px)"
      />

      {/* Animated Elements */}
      <MotionBox
        position="absolute"
        top="10%"
        left="5%"
        width="40vw"
        height="40vw"
        borderRadius="full"
        initial={{ scale: 1, opacity: 0.3 }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.2, 0.3],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: 'radial-gradient(circle, rgba(128,128,128,0.1) 0%, rgba(128,128,128,0) 70%)'
        }}
      />

      <MotionBox
        position="absolute"
        bottom="20%"
        right="10%"
        width="30vw"
        height="30vw"
        borderRadius="full"
        initial={{ scale: 1.2, opacity: 0.2 }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: 'radial-gradient(circle, rgba(128,128,128,0.1) 0%, rgba(128,128,128,0) 70%)'
        }}
      />

      {/* Grid Pattern */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.1}
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      {/* Noise Texture */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.05}
        filter="contrast(120%) brightness(120%)"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />
    </Box>
  );
};

export default AnimatedBackground; 