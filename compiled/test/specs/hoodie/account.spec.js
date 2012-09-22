// Generated by CoffeeScript 1.3.3

describe("Hoodie.Account", function() {
  beforeEach(function() {
    localStorage.clear();
    this.hoodie = new Mocks.Hoodie;
    this.account = new Hoodie.Account(this.hoodie);
    this.requestDefer = this.hoodie.defer();
    spyOn(this.hoodie, "request").andReturn(this.requestDefer.promise());
    spyOn(this.hoodie, "trigger");
    return spyOn(window, "setTimeout").andCallFake(function(cb) {
      return cb();
    });
  });
  describe("constructor", function() {
    beforeEach(function() {
      spyOn(Hoodie.Account.prototype, "authenticate");
      return spyOn(Hoodie.Account.prototype, "on");
    });
    _when("account.username is set", function() {
      beforeEach(function() {
        return spyOn(this.hoodie.my.config, "get").andCallFake(function(key) {
          if (key === '_account.username') {
            return 'joe@example.com';
          }
        });
      });
      return it("should set @username", function() {
        var account;
        account = new Hoodie.Account(this.hoodie);
        return expect(account.username).toBe('joe@example.com');
      });
    });
    _when("account.ownerHash is set", function() {
      beforeEach(function() {
        return spyOn(this.hoodie.my.config, "get").andCallFake(function(key) {
          if (key === '_account.ownerHash') {
            return 'owner_hash123';
          }
        });
      });
      return it("should set @owner", function() {
        var account;
        account = new Hoodie.Account(this.hoodie);
        return expect(account.ownerHash).toBe('owner_hash123');
      });
    });
    _when("account.ownerHash isn't set", function() {
      beforeEach(function() {
        spyOn(this.hoodie.my.config, "get").andCallFake(function(key) {
          if (key === '_account.ownerHash') {
            return void 0;
          }
        });
        spyOn(this.hoodie.my.store, "uuid").andReturn('new_generated_owner_hash');
        return spyOn(this.hoodie.my.config, "set");
      });
      it("should set @owner", function() {
        var account;
        account = new Hoodie.Account(this.hoodie);
        return expect(account.ownerHash).toBe('new_generated_owner_hash');
      });
      return it("should set account.ownerHash", function() {
        var account;
        account = new Hoodie.Account(this.hoodie);
        return expect(account.hoodie.my.config.set).wasCalledWith('_account.ownerHash', 'new_generated_owner_hash');
      });
    });
    it("should authenticate on next tick", function() {
      var account;
      account = new Hoodie.Account(this.hoodie);
      return expect(window.setTimeout).wasCalledWith(account.authenticate);
    });
    return it("should check for a pending password request", function() {
      var account;
      spyOn(Hoodie.Account.prototype, "_checkPasswordResetStatus");
      account = new Hoodie.Account(this.hoodie);
      return expect(Hoodie.Account.prototype._checkPasswordResetStatus).wasCalled();
    });
  });
  describe(".authenticate()", function() {
    _when("@username is undefined", function() {
      beforeEach(function() {
        delete this.account.username;
        return this.promise = this.account.authenticate();
      });
      return it("should return a rejected promise", function() {
        expect(this.promise).toBePromise();
        return expect(this.promise).toBeRejected();
      });
    });
    return _when("@username is 'joe@example.com'", function() {
      beforeEach(function() {
        return this.account.username = 'joe@example.com';
      });
      _and("account is already authenticated", function() {
        beforeEach(function() {
          this.account._authenticated = true;
          return this.promise = this.account.authenticate();
        });
        it("should return a promise", function() {
          return expect(this.promise).toBePromise();
        });
        return it("should resolve the promise", function() {
          return expect(this.promise).toBeResolvedWith('joe@example.com');
        });
      });
      _and("account is unauthenticated", function() {
        beforeEach(function() {
          this.account._authenticated = false;
          return this.promise = this.account.authenticate();
        });
        it("should return a promise", function() {
          return expect(this.promise).toBePromise();
        });
        return it("should reject the promise", function() {
          return expect(this.promise).toBeRejected();
        });
      });
      return _and("account has not been authenticated yet", function() {
        beforeEach(function() {
          return delete this.account._authenticated;
        });
        it("should return a promise", function() {
          return expect(this.account.authenticate()).toBePromise();
        });
        it("should send a GET /_session", function() {
          var args;
          this.account.authenticate();
          expect(this.hoodie.request).wasCalled();
          args = this.hoodie.request.mostRecentCall.args;
          expect(args[0]).toBe('GET');
          return expect(args[1]).toBe('/_session');
        });
        _when("authentication request is successful and returns session info for joe@example.com", function() {
          beforeEach(function() {
            spyOn(this.hoodie.my.config, "set");
            this.response = {
              userCtx: {
                name: "user/joe@example.com",
                roles: ["user_hash", "confirmed"]
              }
            };
            this.requestDefer.resolve(this.response);
            return this.promise = this.account.authenticate();
          });
          it("should set account as authenticated", function() {
            return expect(this.account._authenticated).toBe(true);
          });
          it("should resolve the promise with 'joe@example.com'", function() {
            return expect(this.promise).toBeResolvedWith('joe@example.com');
          });
          it("should set account.username", function() {
            expect(this.account.username).toBe('joe@example.com');
            return expect(this.hoodie.my.config.set).wasCalledWith('_account.username', 'joe@example.com');
          });
          return it("should set account.ownerHash", function() {
            expect(this.account.ownerHash).toBe('user_hash');
            return expect(this.hoodie.my.config.set).wasCalledWith('_account.ownerHash', 'user_hash');
          });
        });
        _when("authentication request is successful and returns `name: null`", function() {
          beforeEach(function() {
            this.requestDefer.resolve({
              userCtx: {
                name: null
              }
            });
            this.account.username = 'joe@example.com';
            return this.promise = this.account.authenticate();
          });
          it("should set account as unauthenticated", function() {
            return expect(this.account._authenticated).toBe(false);
          });
          it("should reject the promise", function() {
            return expect(this.promise).toBeRejected();
          });
          return it("should trigger an `account:error:unauthenticated` event", function() {
            return expect(this.hoodie.trigger).wasCalledWith('account:error:unauthenticated');
          });
        });
        return _when("authentication request has an error", function() {
          beforeEach(function() {
            this.requestDefer.reject({
              responseText: 'error data'
            });
            return this.promise = this.account.authenticate();
          });
          return it("should reject the promise", function() {
            return expect(this.promise).toBeRejectedWith({
              error: 'error data'
            });
          });
        });
      });
    });
  });
  describe(".signUp(username, password)", function() {
    beforeEach(function() {
      var _ref;
      this.signInDefer = this.hoodie.defer();
      spyOn(this.account, "signIn").andReturn(this.signInDefer.promise());
      this.account.ownerHash = "owner_hash123";
      this.account.signUp('joe@example.com', 'secret', {
        name: "Joe Doe"
      });
      _ref = this.hoodie.request.mostRecentCall.args, this.type = _ref[0], this.path = _ref[1], this.options = _ref[2];
      return this.data = JSON.parse(this.options.data);
    });
    it("should send a PUT request to http://my.cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com", function() {
      expect(this.hoodie.request).wasCalled();
      expect(this.type).toBe('PUT');
      return expect(this.path).toBe('/_users/org.couchdb.user%3Auser%2Fjoe%40example.com');
    });
    it("should set contentType to 'application/json'", function() {
      return expect(this.options.contentType).toBe('application/json');
    });
    it("should stringify the data", function() {
      return expect(typeof this.options.data).toBe('string');
    });
    it("should have set _id to 'org.couchdb.user:joe@example.com'", function() {
      return expect(this.data._id).toBe('org.couchdb.user:user/joe@example.com');
    });
    it("should have set name to 'joe@example.com", function() {
      return expect(this.data.name).toBe('user/joe@example.com');
    });
    it("should have set type to 'user", function() {
      return expect(this.data.type).toBe('user');
    });
    it("should have set password to 'secret'", function() {
      return expect(this.data.password).toBe('secret');
    });
    it("should have set ownerHash to 'owner_hash123'", function() {
      return expect(this.data.ownerHash).toBe('owner_hash123');
    });
    it("should have set database to 'user/owner_hash123'", function() {
      return expect(this.data.database).toBe('user/owner_hash123');
    });
    it("should allow to signup without password", function() {
      var _ref;
      this.account.signUp('joe@example.com');
      _ref = this.hoodie.request.mostRecentCall.args, this.type = _ref[0], this.path = _ref[1], this.options = _ref[2];
      this.data = JSON.parse(this.options.data);
      return expect(this.data.password).toBe('');
    });
    _when("signUp successful", function() {
      beforeEach(function() {
        var response;
        response = {
          "ok": true,
          "id": "org.couchdb.user:bizbiz",
          "rev": "1-a0134f4a9909d3b20533285c839ed830"
        };
        return this.requestDefer.resolve(response);
      });
      it("should trigger `account:signup` event", function() {
        this.account.signUp('joe@example.com', 'secret');
        return expect(this.hoodie.trigger).wasCalledWith('account:signup', 'joe@example.com');
      });
      it("should sign in", function() {
        this.account.signUp('joe@example.com', 'secret');
        return expect(this.account.signIn).wasCalledWith('joe@example.com', 'secret');
      });
      _and("signIn successful", function() {
        beforeEach(function() {
          return this.signInDefer.resolve("joe@example.com", 'response');
        });
        return it("should resolve its promise", function() {
          var promise;
          promise = this.account.signUp('joe@example.com', 'secret');
          return expect(promise).toBeResolvedWith('joe@example.com', 'response');
        });
      });
      return _and("signIn not successful", function() {
        beforeEach(function() {
          return this.signInDefer.reject('error');
        });
        return it("should resolve its promise", function() {
          var promise;
          promise = this.account.signUp('joe@example.com', 'secret');
          return expect(promise).toBeRejectedWith('error');
        });
      });
    });
    return _when("signUp has an error", function() {
      beforeEach(function() {
        return this.requestDefer.reject({
          responseText: '{"error":"forbidden","reason":"You stink."}'
        });
      });
      return it("should reject its promise", function() {
        var promise;
        promise = this.account.signUp('notmyfault@example.com', 'secret');
        return expect(promise).toBeRejectedWith({
          error: 'forbidden',
          reason: 'You stink.'
        });
      });
    });
  });
  describe(".anonymousSignUp()", function() {
    beforeEach(function() {
      this.signUpDefer = this.hoodie.defer();
      spyOn(this.account, "signUp").andReturn(this.signUpDefer.promise());
      spyOn(this.hoodie.my.store, "uuid").andReturn("crazyuuid123");
      spyOn(this.hoodie.my.config, "set");
      return this.account.ownerHash = "owner_hash123";
    });
    it("should sign up with username = 'user_anonymous/ownerHash' and the random password", function() {
      this.account.anonymousSignUp();
      return expect(this.account.signUp).wasCalledWith('owner_hash123', 'crazyuuid123');
    });
    return _when("signUp successful", function() {
      beforeEach(function() {
        return this.signUpDefer.resolve();
      });
      return it("should generate a password and store it locally in _account.anonymousPassword", function() {
        this.account.anonymousSignUp();
        expect(this.hoodie.my.store.uuid).wasCalledWith(10);
        return expect(this.hoodie.my.config.set).wasCalledWith('_account.anonymousPassword', 'crazyuuid123');
      });
    });
  });
  describe(".signIn(username, password)", function() {
    beforeEach(function() {
      var _ref;
      this.account.signIn('joe@example.com', 'secret');
      return _ref = this.hoodie.request.mostRecentCall.args, this.type = _ref[0], this.path = _ref[1], this.options = _ref[2], _ref;
    });
    it("should send a POST request to http://my.cou.ch/_session", function() {
      expect(this.hoodie.request).wasCalled();
      expect(this.type).toBe('POST');
      return expect(this.path).toBe('/_session');
    });
    it("should send username as name parameter", function() {
      return expect(this.options.data.name).toBe('user/joe@example.com');
    });
    it("should send password", function() {
      return expect(this.options.data.password).toBe('secret');
    });
    it("should allow to sign in without password", function() {
      var data, _ref;
      this.account.signIn('joe@example.com');
      _ref = this.hoodie.request.mostRecentCall.args, this.type = _ref[0], this.path = _ref[1], this.options = _ref[2];
      data = this.options.data;
      return expect(data.password).toBe('');
    });
    return _when("signIn successful", function() {
      _and("account is confirmed", function() {
        beforeEach(function() {
          this.response = {
            "ok": true,
            "name": "user/joe@example.com",
            "roles": ["user_hash", "confirmed"]
          };
          this.requestDefer.resolve(this.response);
          return spyOn(this.hoodie.my.config, "set");
        });
        it("should trigger `account:signin` event", function() {
          this.account.signIn('joe@example.com', 'secret');
          return expect(this.hoodie.trigger).wasCalledWith('account:signin', 'joe@example.com');
        });
        it("should set @username", function() {
          this.account.signIn('joe@example.com', 'secret');
          expect(this.account.username).toBe('joe@example.com');
          return expect(this.hoodie.my.config.set).wasCalledWith('_account.username', 'joe@example.com');
        });
        it("should set @owner", function() {
          this.account.signIn('joe@example.com', 'secret');
          expect(this.account.ownerHash).toBe('user_hash');
          return expect(this.hoodie.my.config.set).wasCalledWith('_account.ownerHash', 'user_hash');
        });
        it("should fetch the _users doc", function() {
          spyOn(this.account, "fetch");
          this.account.signIn('joe@example.com', 'secret');
          return expect(this.account.fetch).wasCalled();
        });
        return it("should resolve with username and response", function() {
          return expect(this.account.signIn('joe@example.com', 'secret')).toBeResolvedWith('joe@example.com', this.response);
        });
      });
      _and("account not (yet) confirmed", function() {
        beforeEach(function() {
          this.response = {
            "ok": true,
            "name": "user/joe@example.com",
            "roles": []
          };
          return this.requestDefer.resolve(this.response);
        });
        return it("should reject with unconfirmed error.", function() {
          var promise;
          promise = this.account.signIn('joe@example.com', 'secret');
          return expect(promise).toBeRejectedWith({
            error: "unconfirmed",
            reason: "account has not been confirmed yet"
          });
        });
      });
      return _and("account has an error", function() {
        beforeEach(function() {
          var _this = this;
          this.response = {
            "ok": true,
            "name": "user/joe@example.com",
            "roles": ['error']
          };
          this.requestDefer.resolve(this.response);
          return spyOn(this.account, "fetch").andCallFake(function() {
            _this.account._doc.$error = 'because you stink!';
            return _this.hoodie.defer().resolve();
          });
        });
        it("should fetch user doc without setting @username", function() {
          this.account.signIn('joe@example.com', 'secret');
          expect(this.account.fetch).wasCalledWith('joe@example.com');
          return expect(this.account.username).toBeUndefined();
        });
        return it("should reject with the reason", function() {
          return expect(this.account.signIn('joe@example.com', 'secret')).toBeRejectedWith({
            error: 'error',
            reason: 'because you stink!'
          });
        });
      });
    });
  });
  describe(".changePassword(currentPassword, newPassword)", function() {
    beforeEach(function() {
      var _ref;
      this.account.username = 'joe@example.com';
      this.account._doc = {
        _id: 'org.couchdb.user:user/joe@example.com',
        name: 'user/joe@example.com',
        type: 'user',
        roles: [],
        salt: 'absalt',
        password_sha: 'pwcdef'
      };
      this.account.changePassword('currentSecret', 'newSecret');
      _ref = this.hoodie.request.mostRecentCall.args, this.type = _ref[0], this.path = _ref[1], this.options = _ref[2];
      return this.data = JSON.parse(this.options.data);
    });
    it("should send a PUT request to http://my.cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com", function() {
      expect(this.hoodie.request).wasCalled();
      expect(this.type).toBe('PUT');
      return expect(this.path).toBe('/_users/org.couchdb.user%3Auser%2Fjoe%40example.com');
    });
    it("should set contentType to 'application/json'", function() {
      return expect(this.options.contentType).toBe('application/json');
    });
    it("should stringify the data", function() {
      return expect(typeof this.options.data).toBe('string');
    });
    it("should have set _id to 'org.couchdb.user:user/joe@example.com'", function() {
      return expect(this.data._id).toBe('org.couchdb.user:user/joe@example.com');
    });
    it("should have set name to 'user/joe@example.com", function() {
      return expect(this.data.name).toBe('user/joe@example.com');
    });
    it("should have set type to 'user", function() {
      return expect(this.data.type).toBe('user');
    });
    it("should pass password", function() {
      return expect(this.data.password).toBe('newSecret');
    });
    it("should allow to set empty password", function() {
      var _ref;
      this.account.changePassword('currentSecret', '');
      _ref = this.hoodie.request.mostRecentCall.args, this.type = _ref[0], this.path = _ref[1], this.options = _ref[2];
      this.data = JSON.parse(this.options.data);
      return expect(this.data.password).toBe('');
    });
    it("should not send salt", function() {
      return expect(this.data.salt).toBeUndefined();
    });
    it("should not send password_sha", function() {
      return expect(this.data.password_sha).toBeUndefined();
    });
    _when("change password successful", function() {
      beforeEach(function() {
        this.signInDefer = this.hoodie.defer();
        spyOn(this.account, "signIn").andReturn(this.signInDefer.promise());
        return this.requestDefer.resolve({
          "ok": true,
          "id": "org.couchdb.user:user/bizbiz",
          "rev": "2-345"
        });
      });
      it("should sign in", function() {
        this.account.changePassword('currentSecret', 'newSecret');
        return expect(this.account.signIn).wasCalledWith('joe@example.com', 'newSecret');
      });
      _when("sign in successful", function() {
        beforeEach(function() {
          return this.signInDefer.resolve();
        });
        return it("should resolve its promise", function() {
          var promise;
          promise = this.account.changePassword('currentSecret', 'newSecret');
          return expect(promise).toBeResolved();
        });
      });
      return _when("sign in not successful", function() {
        beforeEach(function() {
          return this.signInDefer.reject();
        });
        return it("should reject its promise", function() {
          var promise;
          promise = this.account.changePassword('currentSecret', 'newSecret');
          return expect(promise).toBeRejected();
        });
      });
    });
    return _when("signUp has an error", function() {
      beforeEach(function() {
        return this.requestDefer.reject();
      });
      return it("should reject its promise", function() {
        var promise;
        promise = this.account.changePassword('currentSecret', 'newSecret');
        return expect(promise).toBeRejectedWith({
          error: "unknown"
        });
      });
    });
  });
  describe(".signOut()", function() {
    beforeEach(function() {
      var _ref;
      spyOn(this.hoodie.my.remote, "disconnect");
      this.account.signOut();
      return _ref = this.hoodie.request.mostRecentCall.args, this.type = _ref[0], this.path = _ref[1], this.options = _ref[2], _ref;
    });
    it("should disconnect", function() {
      return expect(this.hoodie.my.remote.disconnect).wasCalled();
    });
    it("should send a DELETE request to http://my.cou.ch/_session", function() {
      expect(this.hoodie.request).wasCalled();
      expect(this.type).toBe('DELETE');
      return expect(this.path).toBe('/_session');
    });
    return _when("signUp successful", function() {
      beforeEach(function() {
        this.requestDefer.resolve();
        spyOn(this.hoodie.my.config, "clear");
        return this.account.signOut();
      });
      it("should trigger `account:signout` event", function() {
        return expect(this.hoodie.trigger).wasCalledWith('account:signout');
      });
      it("should unset @owner", function() {
        return expect(this.account.ownerHash).toBeUndefined();
      });
      it("should unset @username", function() {
        return expect(this.account.username).toBeUndefined();
      });
      return it("should clear config", function() {
        return expect(this.hoodie.my.config.clear).wasCalled();
      });
    });
  });
  describe(".hasAnonymousAccount()", function() {
    _when("_account.anonymousPassword is set", function() {
      return beforeEach(function() {
        spyOn(this.hoodie.my.config, "get").andCallFake(function(key) {
          if (key === '_account.username') {
            return 'password';
          }
        });
        return it("should return true", function() {
          return expect(this.account.hasAnonymousAccount()).toBe(true);
        });
      });
    });
    return _when("_account.anonymousPassword is not set", function() {
      beforeEach(function() {
        return spyOn(this.hoodie.my.config, "get").andCallFake(function(key) {
          if (key === '_account.username') {
            return void 0;
          }
        });
      });
      return it("should return false", function() {
        return expect(this.account.hasAnonymousAccount()).toBe(false);
      });
    });
  });
  describe(".on(event, callback)", function() {
    beforeEach(function() {
      return spyOn(this.hoodie, "on");
    });
    return it("should proxy to @hoodie.on() and namespace with account", function() {
      var party;
      party = jasmine.createSpy('party');
      this.account.on('funky', party);
      return (expect(this.hoodie.on)).wasCalledWith('account:funky', party);
    });
  });
  describe(".db()", function() {
    return _when("account.ownerHash is 'owner_hash123'", function() {
      beforeEach(function() {
        return this.account.ownerHash = 'owner_hash123';
      });
      return it("should return 'joe$example.com", function() {
        return (expect(this.account.db())).toEqual('user/owner_hash123');
      });
    });
  });
  describe(".fetch()", function() {
    _when("username is not set", function() {
      beforeEach(function() {
        this.account.username = null;
        return this.account.fetch();
      });
      return it("should not send any request", function() {
        return expect(this.hoodie.request).wasNotCalled();
      });
    });
    return _when("username is joe@example.com", function() {
      beforeEach(function() {
        var _ref;
        this.account.username = 'joe@example.com';
        this.account.fetch();
        return _ref = this.hoodie.request.mostRecentCall.args, this.type = _ref[0], this.path = _ref[1], this.options = _ref[2], _ref;
      });
      it("should send a GET request to http://my.cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com", function() {
        expect(this.hoodie.request).wasCalled();
        expect(this.type).toBe('GET');
        return expect(this.path).toBe('/_users/org.couchdb.user%3Auser%2Fjoe%40example.com');
      });
      return _when("successful", function() {
        beforeEach(function() {
          this.response = {
            "_id": "org.couchdb.user:baz",
            "_rev": "3-33e4d43a6dff5b29a4bd33f576c7824f",
            "name": "baz",
            "salt": "82163606fa5c100e0095ad63598de810",
            "password_sha": "e2e2a4d99632dc5e3fdb41d5d1ff98743a1f344e",
            "type": "user",
            "roles": []
          };
          return this.requestDefer.resolve(this.response);
        });
        return it("should resolve its promise", function() {
          var promise;
          promise = this.account.fetch();
          return expect(promise).toBeResolvedWith(this.response);
        });
      });
    });
  });
  describe(".destroy()", function() {
    beforeEach(function() {
      spyOn(this.hoodie.my.remote, "disconnect");
      spyOn(this.account, "fetch").andReturn(this.hoodie.defer().resolve().promise());
      this.account.username = 'joe@example.com';
      return this.account._doc = {
        _rev: '1-234'
      };
    });
    it("should disconnect", function() {
      this.account.destroy();
      return expect(this.hoodie.my.remote.disconnect).wasCalled();
    });
    it("should fetch the account", function() {
      this.account.destroy();
      return expect(this.account.fetch).wasCalled();
    });
    it("should send a PUT request to /_users/org.couchdb.user%3Auser%2Fjoe%40example.com", function() {
      this.account.destroy();
      return expect(this.hoodie.request).wasCalledWith('PUT', '/_users/org.couchdb.user%3Auser%2Fjoe%40example.com', {
        data: JSON.stringify({
          _rev: '1-234',
          _deleted: true
        }),
        contentType: 'application/json'
      });
    });
    return _when("destroy request succesful", function() {
      beforeEach(function() {
        return this.hoodie.request.andReturn(this.hoodie.defer().resolve().promise());
      });
      it("should unset @username", function() {
        this.account.destroy();
        return expect(this.account.username).toBeUndefined();
      });
      return it("should unset @owner", function() {
        this.account.destroy();
        return expect(this.account.ownerHash).toBeUndefined();
      });
    });
  });
  describe(".resetPassword(username)", function() {
    beforeEach(function() {
      return spyOn(this.account, "_checkPasswordResetStatus").andReturn("checkPasswordResetPromise");
    });
    _when("there is a pending password reset request", function() {
      beforeEach(function() {
        spyOn(this.hoodie.my.config, "get").andReturn("joe/uuid567");
        return this.account.resetPassword();
      });
      it("should not send another request", function() {
        return expect(this.hoodie.request).wasNotCalled();
      });
      it("should check for the status of the pending request", function() {
        return expect(this.account._checkPasswordResetStatus).wasCalled();
      });
      return it("should return the promise by the status request", function() {
        return expect(this.account.resetPassword()).toBe('checkPasswordResetPromise');
      });
    });
    return _when("there is no pending password reset request", function() {
      beforeEach(function() {
        var _ref;
        spyOn(this.hoodie.my.config, "get").andReturn(void 0);
        spyOn(this.hoodie.my.config, "set");
        spyOn(this.hoodie.my.store, "uuid").andReturn('uuid567');
        this.account.resetPassword("joe@example.com");
        _ref = this.hoodie.request.mostRecentCall.args, this.method = _ref[0], this.path = _ref[1], this.options = _ref[2];
        return this.data = JSON.parse(this.options.data);
      });
      it("should generate a reset Password Id and store it locally", function() {
        return expect(this.hoodie.my.config.set).wasCalledWith("_account.resetPasswordId", "joe@example.com/uuid567");
      });
      it("should send a PUT request to /_users/org.couchdb.user%3A%24passwordReset%2Fjoe%40example.com%2Fuuid567", function() {
        expect(this.method).toBe('PUT');
        return expect(this.path).toBe('/_users/org.couchdb.user%3A%24passwordReset%2Fjoe%40example.com%2Fuuid567');
      });
      it("should send data with contentType 'application/json'", function() {
        return expect(this.options.contentType).toBe('application/json');
      });
      it("should send a new _users object", function() {
        expect(this.data._id).toBe('org.couchdb.user:$passwordReset/joe@example.com/uuid567');
        expect(this.data.name).toBe("$passwordReset/joe@example.com/uuid567");
        expect(this.data.type).toBe('user');
        expect(this.data.password).toBe('joe@example.com/uuid567');
        expect(this.data.$createdAt).toBeDefined();
        return expect(this.data.$updatedAt).toBeDefined();
      });
      it("should return a promise", function() {
        return expect(this.account.resetPassword("joe@example.com")).toBePromise();
      });
      _when("reset Password request successful", function() {
        beforeEach(function() {
          this.promiseSpy = jasmine.createSpy('promiseSpy');
          this.account._checkPasswordResetStatus.andReturn({
            then: this.promiseSpy
          });
          return this.requestDefer.resolve();
        });
        it("should check for the request status", function() {
          this.account.resetPassword('joe@example.com');
          return expect(this.account._checkPasswordResetStatus).wasCalled();
        });
        return it("should be resolved", function() {
          return expect(this.account.resetPassword('joe@example.com')).toBeResolved();
        });
      });
      return _when("reset Password request is not successful", function() {
        beforeEach(function() {
          return this.requestDefer.reject({
            responseText: '{"error": "ooops"}'
          });
        });
        return it("should be rejected with the error", function() {
          return expect(this.account.resetPassword('joe@example.com')).toBeRejectedWith({
            error: 'ooops'
          });
        });
      });
    });
  });
  return describe(".changeUsername(currentPassword, newUsername)", function() {
    beforeEach(function() {
      this.authenticateDefer = this.hoodie.defer();
      spyOn(this.account, "authenticate").andReturn(this.authenticateDefer.promise());
      return this.account.changeUsername('secret', 'new.joe@example.com');
    });
    it("should authenticate", function() {
      return expect(this.account.authenticate).wasCalled();
    });
    return it("should return a promise", function() {
      return expect(this.account.changeUsername()).toBePromise();
    });
  });
});
