import { Fragment } from 'react';
import {
  Box,
  ChakraProvider,
  Divider,
  Flex,
  Heading,
  Link,
  ListItem,
  Text,
  UnorderedList,
} from '@chakra-ui/react';
import Title from '../components/Title';
import DiscordEventLink from '../components/DiscordEventLink';
import { FaDiscord } from 'react-icons/fa';

export default function Home() {
  return (
    <ChakraProvider>
      <Title>Alles Standard</Title>
      <Box padding={10}>
        <Divider />
      </Box>
      <Box as="main" p={4}>
        <Text mb={4}>
          Wir wollen wieder mehr Standard spielen in Hamburg, deswegen werden
          wir in Zukunft Turniere organisieren in Zusammenarbeit mit Läden oder
          eben privat in diversen Locations in Hamburg.
        </Text>
        <Text mb={4}>
          Um das Ganze etwas zu pushen und Anreize zu schaffen, werden wir auch
          eine Liga organisieren, die aus einem Preispool gefüttert wird, der
          noch organisiert wird. Dies können Booster, Singles, Playsets oder
          Zubehör sein, also quasi alles, was man zum Spielen von Standard
          braucht.
        </Text>
        <Text mb={4}>
          Die Rangliste der Liga wird hier auf der Seite veröffentlicht, wie
          genau ist noch nicht komplett entschieden, wegen des Datenschutzes.
        </Text>
        <Heading as="h2" size="lg" mb={4}>
          Nächsten Termine
        </Heading>
        <UnorderedList>
          <ListItem>
            <Text>
              <time dateTime="2024-10-23">23 Oktober</time> Staandard @ Xperion
              Hamburg
            </Text>
            <DiscordEventLink
              url="https://discord.gg/fj2fqrXf?event=1297836834667233280"
              linkText="Auf Discord teilnehmen"
            />
          </ListItem>
          <ListItem>
            <Text textDecoration="line-through">
              Turnier: <time dateTime="2024-10-18">18 Oktober</time> Store
              Championship in Elmshorn.
            </Text>
          </ListItem>
          <ListItem>
            <Text textDecoration="line-through">
              1. Turnier: <time dateTime="2024-08-24">24 August</time> Store
              Championship im Atlantis.
            </Text>
          </ListItem>
        </UnorderedList>
      </Box>
      <Box as="footer" py={4} bg="gray.800" color="white">
        <Flex justify="center" align="center">
          <Text mr={2}>Kommt in unsere Discord Community:</Text>
          <Link href="https://discord.gg/My9pDdnsGC" isExternal>
            <FaDiscord size="24px" />
          </Link>
        </Flex>
      </Box>
    </ChakraProvider>
  );
}
