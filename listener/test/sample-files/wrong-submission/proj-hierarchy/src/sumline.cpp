#include <string>

using namespace std;

int sumline(string line) {
  int sum = 0;
  int number = 0;
  for (int i = 0; i < line.length(); i++) {
    char digit = line[i];
    if (digit - '0' < 10 && digit - '0' >= 0) {
      number = number * 10 + (int)(digit - '0');
    } else {
      sum += number;
      number = 0;
    }
  }
  sum += number;
  return sum;
}