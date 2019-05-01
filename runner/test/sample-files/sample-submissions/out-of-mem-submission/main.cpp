#include <iostream>
using namespace std;

/**
 * Outputs before the OOM condition should be collected by
 * the code runner.
 *
 */
int main() {
  cout << "Some output before the OOM" << endl;
  uint64_t** tooLarge = new uint64_t*[1024];
  for (int i = 0; i < 1024; i++) {
    tooLarge[i] = new uint64_t[256];
    for (int j = 0; j < 256; j++) {
      tooLarge[i][j] = 1;
    }
  }
  return 0;
}