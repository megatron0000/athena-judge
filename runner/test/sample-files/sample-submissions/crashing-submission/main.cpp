#include <iostream>
using namespace std;
int main() {
  cout << "Some output before the crash" << endl;
  throw 123;
  return 0;
}