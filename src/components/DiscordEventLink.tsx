import { Box, Link, Text, Flex } from '@chakra-ui/react';
import { FaDiscord } from 'react-icons/fa';
import React from 'react';

interface DiscordEventLinkProps {
  url: string;
  linkText: string;
  description?: string;
}

const DiscordEventLink: React.FC<DiscordEventLinkProps> = ({
  url,
  linkText,
  description,
}) => {
  return (
    <Box
      as="button"
      p={2}
      bg="gray.700"
      color="white"
      borderRadius="md"
      boxShadow="md"
    >
      <Flex align="center">
        <FaDiscord size="24px" color="#7289da" />
        <Link
          href={url}
          isExternal
          ml={2}
          fontWeight="bold"
          color="blue.200"
          _hover={{ color: 'blue.300', textDecoration: 'underline' }}
        >
          {linkText}
        </Link>
      </Flex>
      {description && (
        <Text mt={2} fontSize="sm" color="gray.300">
          {description}
        </Text>
      )}
    </Box>
  );
};

export default DiscordEventLink;
