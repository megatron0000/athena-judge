#include <iostream>
#include <string>

using namespace std;

/**
 * Reads lines from stdin and reports the sum of integers of each line.
 * 
 * Example: 
 * stdin:
 * 1 2 3 5
 * 3 3
 * stdout:
 * 11
 * 6
 * 
 */
int main() {
  string line;
  while (getline(cin, line)) {
    cin >> ws;
    int number = 0;
    int sum = 0;
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

    cout << sum << endl;
  }
}