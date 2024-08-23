import {
  ChakraProvider,
  Box,
  Heading,
  Text,
  UnorderedList,
  ListItem,
} from '@chakra-ui/react';

export default function Home() {
  return (
    <ChakraProvider>
      <Box as="main" p={4}>
        <Heading as="h1">Alles Standard</Heading>
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
            1. Turnier: <time dateTime="2024-08-24">24 August</time> Store
            Championship im Atlantis.
          </ListItem>
        </UnorderedList>
      </Box>
    </ChakraProvider>
  );
}
