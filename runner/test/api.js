let assert = require('assert')
let request = require('request-promise-native')

const run_endpoint = 'http://localhost:3001/run'

function clone_obj(obj) {
  return JSON.parse(JSON.stringify(obj))
}

const default_options = {
  method: 'POST',
  uri: run_endpoint,
  body: null,
  json: true
}

/* describe('/run', function () {

  this.timeout(60000)

  // mocha uses the number of arguments of the callback !
  it('should handle multiple users at once', async () => {
    const first_req = clone_obj(default_options)
    const second_req = clone_obj(default_options)
    first_req.body = {
      "source": "#include <iostream> \n using namespace std; \n int main() { cout << \"Sou o cliente 1 !\" << endl; return 0;}",
      "input": "1"
    }
    second_req.body = {
      "source": "#include <iostream> \n using namespace std; \n int main() { cout << \"Sou o cliente 2 !\" << endl; return 0;}",
      "input": "2"
    }
    const [
      first_body,
      second_body
    ] = await Promise.all([request(first_req), request(second_req)])

    assert.equal(first_body.data[0].data, 'Sou o cliente 1 !\n',
      'Client requests got mixed')
    assert.equal(second_body.data[0].data, 'Sou o cliente 2 !\n',
      'Client requests got mixed')
  })

  it('should set OutOfMemoryError on memory excess usage', async () => {
    const req = clone_obj(default_options)
    req.body = {
      "source": "#include <iostream> \n using namespace std; \n int main() { cout << \"Another program is running !\" << endl; uint64_t*** tooLarge = new uint64_t**[1024]; for(int i = 0; i < 1024; i++) { tooLarge[i] = new uint64_t*[1024]; for(int j = 0; j < 2014; j++) { tooLarge[i][j] = new uint64_t[2014]; for (int k = 0; k < 1024; k++) { tooLarge[i][j][k] = 1; } } }  return 0;}",
      "input": "1"
    }

    const body = await request(req)
    assert.equal(body.error, 'OutOfMemoryError',
      'OutOfMemoryError was not set')
  })

  it('should set TimeLimitError on time excess usage', async () => {
    const req = clone_obj(default_options)
    req.body = {
      "source": "#include <iostream> \n using namespace std; \n int main() { cout << \"Another program is running !\" << endl; while(true) {} return 0;}",
      "input": "1"
    }

    const body = await request(req)
    assert.equal(body.error, 'TimeLimitError', 'TimeLimitError was not set')
  })

})
 */