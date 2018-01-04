# Digital Ocean Dynamic DNS Service

A simple nodejs based [namecheap](https://www.namecheap.com) compatible dynamic DNS updated service for
Digital Ocean. The service includes a single endpoint `/update` that expects a `PUT` request with
`domain`, `host`, `password` and `ip` parameters. It then makes a call to the [Digital Ocean Version 2 API](https://developers.digitalocean.com/documentation/v2/)
to update an associated `A` record to point to the provided IP.

## Why
The [UniFi Security Gateway](https://www.ubnt.com/unifi-routing/usg/) provides built-in support for
a limited number of dynamic DNS services. They don't provide support for Digitial Ocean and namecheap
was one of the few they supported that didn't leverage basic auth. With this service you can select
namecheap from the Dynamic DNS service list and specify the server where this service is running in
the `server` field to have the USG reach out to this service. The value for hostname will be sent as
the `host` parameter, username will be sent as `domain` and password will be sent as `password`.

## Security
The service should be run behind a proxy which has `SSL` enabled like nginx, apache, or something else.
It can also be modified to start the service with SSL itself but that is beyond the scope of this README.
There is very basic security built-in to the service in the form of the query parameter `password` which
is then hashed using scrypt and compared to the `HASHED_CREDENTIALS` value from the configuration file.
Before the hashes are checked the `host` and `domain` query parameters are used to find a corresponding DNS
record ID in the `DOMAINS` configuration map. If no matching domain is found a `403` is returned before
attempting to compare the password hash.

## Service Configuration
The service relies on a config file `config.json` and example of the configuration file is provided.

- `API_TOKEN` is the token used to communicate with the digital ocean API. You can generate
a token on the [Apps & API](https://cloud.digitalocean.com/settings/applications) page of your account.
The token will need to have `WRITE` access.
- `HASHED_CREDENTIALS` should be the base64 encoded string for an scrypt generate "secret" hash. You
can generate this value after you've done an `npm install` from this directory via the node command line:
```
localhost:do-dyndns root$ node
> const scrypt = require('scrypt');
undefined
> let password = 'SECRET';
undefined
> scrypt.hashSync(password, {'N': 2,'r': 1,'p': 1}, 64, password).toString('base64');
'SNRxlb5dmc5jvs5amUzKPIwq0glkBxvUapBtUkbjlWc3uOXakGgh0LO14ZksyMAjJA9xQvMrmlh9IqaXO020yQ=='
```
- `SERVER_CONFIG` is a (hapi server configuration object)[https://hapijs.com/api/16.6.2#serverconnectionoptions]

### Using Docker
The service can be run as a docker container using the standard service port `8002` using the provided
[Dockerfile](Dockerfile). A [Makefile](Makefile) has also been included for convenience and supports
the following commands:
* `build` - builds the do_dyndns docker image
* `run` - runs the service in docker using the do_dyndns image
* `clean` - stops and removes and containers using the do_dyndns image and removes the image

### License
Copyright (c) 2018 Kyle Lilly (kylelilly@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy,
modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.