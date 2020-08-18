import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

interface CartTotal {
  total: number;
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      const favorite = await api.get(`favorites`, {
        params: {
          id: routeParams.id,
        },
      });

      api.get<Food>(`foods/${routeParams.id}`).then(response => {
        setFood(response.data);

        const parsedExtras = response.data.extras.map(extra => {
          return {
            ...extra,
            quantity: 0,
          };
        });

        setExtras(parsedExtras);
        if (favorite) {
          setIsFavorite(true);
        } else {
          setIsFavorite(false);
        }
      });
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    const incrementedExtra: Extra | undefined = extras.find(
      extra => extra.id === id,
    );

    if (incrementedExtra) {
      const extraToIncrementIndex = extras.findIndex(extra => extra.id === id);
      const newExtras = [...extras];

      incrementedExtra.quantity = incrementedExtra.quantity
        ? incrementedExtra.quantity + 1
        : 1;
      newExtras[extraToIncrementIndex] = incrementedExtra;
      setExtras(newExtras);
    }
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    const decrementedExtra: Extra | undefined = extras.find(
      extra => extra.id === id,
    );

    if (decrementedExtra) {
      const extraToDecrementIndex = extras.findIndex(extra => extra.id === id);
      const newExtras = [...extras];

      decrementedExtra.quantity = decrementedExtra.quantity
        ? decrementedExtra.quantity - 1
        : 0;
      newExtras[extraToDecrementIndex] = decrementedExtra;
      setExtras(newExtras);
    }
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    setFoodQuantity(foodQtd => foodQtd + 1);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    setFoodQuantity(foodQtd => (foodQtd <= 1 ? 1 : foodQtd - 1));
  }

  const toggleFavorite = useCallback(() => {
    // Toggle if food is favorite or not
    if (isFavorite) {
      api.delete(`favorites/${food.id}`).then(response => {
        setIsFavorite(false);
      });
    } else {
      api.post('favorites', food).then(response => {
        setIsFavorite(true);
      });
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    if (extras) {
      const extrasTotal = extras
        .filter(item => item.quantity > 0)
        .map(item => {
          return { total: item.quantity * item.value };
        })
        .reduce(
          (prev: { total: number }, next) => {
            return { total: prev.total + next.total };
          },
          { total: 0 },
        );

      const totalFood = food.price * foodQuantity;

      const cartTotalValue = totalFood + extrasTotal.total;

      return formatValue(cartTotalValue);
    }
    return 0;
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    const { id, description, name, price, image_url } = food;
    api
      .post('orders', {
        product_id: id,
        name,
        description,
        price,
        quantity: foodQuantity,
        thumbnail_url: image_url,
        extras: [...extras.filter(item => item.quantity > 0)],
      })
      .then(response => {
        navigation.navigate('Orders');
      });
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
