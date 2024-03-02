// Use this code in Arduino IDE.

const int gasSensorPin = A0;
const int redledPin = 13;
const int greenledPin = 12;

const int threshold = 300;

void setup()
{
  Serial.begin(9600);

  pinMode(redledPin, OUTPUT);
  pinMode(greenledPin, OUTPUT);
}

void loop()
{
  int sensorValue = analogRead(gasSensorPin);

  float voltage = sensorValue * (5.0 / 1023.0);

  Serial.print(sensorValue);
  Serial.print(",");
  Serial.print(voltage);
  Serial.print("\n");

  if (sensorValue > threshold)
  {
    digitalWrite(redledPin, HIGH);
    digitalWrite(greenledPin, LOW);
  }
  else
  {
    digitalWrite(redledPin, LOW);
    digitalWrite(greenledPin, HIGH);
  }

  delay(300);
}
