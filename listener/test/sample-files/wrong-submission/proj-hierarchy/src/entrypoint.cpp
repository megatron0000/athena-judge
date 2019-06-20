#include <iostream>
#include <string>
#include "sumline.h"

using namespace std;

/**
 * Reads lines from stdin and reports the sum of integers of each line,
 * but misses on the 3rd line (if stdin has a 3rd line)
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
  int linecount = 0;
  while (getline(cin, line)) {
    linecount++;
    if (linecount == 3) {
      cout << -1 << endl;
      continue;
    }
    cin >> ws;

    cout << sumline(line) << endl;
  }
}