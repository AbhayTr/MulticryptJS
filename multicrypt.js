class End2End
{

    constructor(parameters)
    {
        this.char_glyph = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
        this.primes_list = 
        [
            2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 
            61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131,
            137, 139, 149, 151, 157, 163, 167, 173, 179, 181,  191, 193, 197, 
            199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 
            277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349
        ];
        this.schema = 
        {
            "1": "a",
            "2": "b",
            "3": "c",
            "4": "d",
            "5": "e",
            "6": "f",
            "7": "g",
            "8": "h",
            "9": "i",
            "0": "j"
        }
        this.reverse_schema =
        {
            "a": "1",
            "b": "2",
            "c": "3",
            "d": "4",
            "e": "5",
            "f": "6",
            "g": "7",
            "h": "8",
            "i": "9",
            "j": "0"
        }
        this.public_key = "";
        this.private_key = "";
        this.save = true;
        this.new_keys = false;
        if (parameters != null)
        {
            if (parameters.public_key && parameters.private_key)
            {
                this.public_key = parameters.public_key;
                this.private_key = parameters.private_key;
            }
            if (parameters.save)
            {
                this.save = parameters.save;
            }
            if (parameters.new)
            {
                this.new_keys = parameters.new;
            }
        }
        if (this.public_key == "" || this.private_key == "")
        {
            try
            {
                if (this.new_keys)
                {
                    throw new Error("Generate New Key Pair.");
                }
                this.private_key = localStorage.private_key;
                this.public_key = localStorage.public_key;
                if (!this.private_key || !this.public_key)
                {
                    throw new Error("Generate New Key Pair.");
                }
            }
            catch (generate_new)
            {
                var fresh_keys = this.get_keys();
                this.private_key = fresh_keys.private;
                this.public_key = fresh_keys.public;
                if (this.save)
                {
                    localStorage.setItem("private_key", this.private_key);
                    localStorage.setItem("public_key", this.public_key);
                }
            }
        }
        else
        {
            if (this.save)
            {
                localStorage.setItem("private_key", this.private_key);
                localStorage.setItem("public_key", this.public_key);
            }
        }
    }

    mod(base, exp, mod)
    {
        if (exp == 0n)
        {
            return 1n;
        }
        if (exp % 2n == 0n)
        {
            return (this.mod(base, (exp / 2n), mod) ** 2n) % mod;
        }
        else
        {
            return (base * this.mod(base, (exp - 1n), mod)) % mod;
        }
    }

    random(lowBigInt, highBigInt)
    {
        const difference = highBigInt - lowBigInt;
        const differenceLength = difference.toString().length;
        let multiplier = '';
        while (multiplier.length < differenceLength)
        {
          multiplier += Math.random().toString().split('.')[1];
        }
        multiplier = multiplier.slice(0, differenceLength);
        const divisor = '1' + '0'.repeat(differenceLength);
        const randomDifference = (difference * BigInt(multiplier)) / BigInt(divisor);
        return lowBigInt + randomDifference;
    }

    number(n)
    {
        var min = (2n ** (BigInt(n) - 1n)) + 1n;
        var max = (2n ** BigInt(n)) - 1n;    
        return this.random(min, max);
    }

    n_bits_prime(n)
    {
        while (true)
        {
            var prime_number = this.number(n);
            for (var divisor_index = 0; divisor_index < this.primes_list.length; divisor_index++)
            {
                var divisor = BigInt(this.primes_list[divisor_index]);
                if (prime_number % divisor == 0n && divisor ** 2n <= prime_number)
                {
                    break;
                }
            }
            return prime_number;
        }
    }

    check_prime_strength(prime_number)
    {
        var inner_this = this;
        var max_divisions_two = 0n;
        var ec = prime_number - 1n;
        while (ec % 2n == 0n)
        {
            ec >>= 1n;
            max_divisions_two += 1n;
        }
        console.assert(2n ** max_divisions_two * ec == prime_number - 1n)

        function trial_composite(round_tester)
        {
            if (inner_this.mod(round_tester, ec, prime_number) == 1n)
            {
                return false;
            }
            for (var i = 0n; i < max_divisions_two; i++)
            {
                if (inner_this.mod(round_tester, (2n ** i * ec), prime_number) == (prime_number - 1n))
                {
                    return false;
                }
            }
            return true;
        }

        for (var i = 0n; i < 20n; i++)
        {
            var round_tester = this.random(2n, prime_number)
            if (trial_composite(round_tester))
            {
                return false;
            }
            return true;
        }
    }

    is_coprime(number1, number2)
    {
        while (number2 != 0n)
        {
            var prev_number_1 = number1;
            number1 = number2;
            number2 = prev_number_1 % number2;
        }
        return number1 == 1n;
    }

    mod_inverse(number1, number2)
    {
        function modulo_inverse(number1, number2)
        {
            if (number2 == 0n)
            {
                return [1n, 0n];
            }
            var q, r, s, t = 0;
            [q, r] = [number1 / number2, number1 % number2];
            [s, t] = modulo_inverse(number2, r);
            return [t, s - (q * t)];
        }
        var inv = modulo_inverse(number1, number2)[0];
        if (inv < 1n)
        {
            inv += number2;
        }
        return inv;
    }

    hexlify(str)
    {
        var result = '';
        var padding = '00';
        for (var i = 0; i < str.length; i++) 
        {
            var digit = str.charCodeAt(i).toString(16);
            var padded = (padding + digit).slice(-2);
            result += padded;
        }
        return result;
    }
    
    unhexlify(str)
    {
        var result = '';
        for (var i = 0; i < str.length; i += 2)
        {
            result += String.fromCharCode(parseInt(str.substr(i, 2), 16));
        }
        return result;
    }

    compress_string(string)
    {
        return BigInt(parseInt(this.hexlify(encodeURI(string)), 16));
    }
    
    deflate_string(number)
    {
        var number_string = number.toString(16);
        var encoded_bytes = encodeURI(number_string);
        return decodeURI(this.unhexlify(encoded_bytes));
    }

    compress_number(number)
    {
        var compressed_number_string = "";
        for (var digit_number = 0; digit_number < number.length; digit_number++)
        {
            try
            {
                var formatted_digit = this.schema[String(number[digit_number])];
                if (formatted_digit != null)
                {
                    compressed_number_string += formatted_digit;
                }
                else
                {
                    throw new Error("Directly add charecter");
                }
            }
            catch (direct_add)
            {
                compressed_number_string += number[digit_number];
            }
        }
        return compressed_number_string;
    }

    deflate_number(number_string)
    {
        var deflated_number = "";
        for (var charecter_number = 0; charecter_number < number_string.length; charecter_number++)
        {
            try
            {
                var original_digit = this.reverse_schema[String(number_string[charecter_number])];
                if (original_digit != null)
                {
                    deflated_number += original_digit;
                }
                else
                {
                    throw new Error("Directly add charecter");
                }
            }
            catch (direct_add)
            {
                deflated_number += number_string[charecter_number];
            }
        }
        return deflated_number;
    }

    get_keys()
    {
        var prime_key_1 = 0;
        var prime_key_2 = 0;
        while (true)
        {
            var prime_key = this.n_bits_prime(1024);
            if (this.check_prime_strength(prime_key))
            {
                if (prime_key_1 == 0)
                {
                    prime_key_1 = prime_key;
                }
                else if (prime_key_2 == 0)
                {
                    prime_key_2 = prime_key
                    break;
                }
            }
        }
        var public_key_number = prime_key_1 * prime_key_2;
        var phi_n = (prime_key_1 - 1n) * (prime_key_2 - 1n);
        var e = 0n;
        for (var number = 2n; number < phi_n; number++)
        {
            if (this.is_coprime(phi_n, number))
            {
                e = number;
                break;
            }
        }
        var public_key = String(public_key_number) + "X" + String(e);
        var private_key = String(this.mod_inverse(e, phi_n)) + "X" + String(public_key_number);
        return {private: this.compress_number(private_key), public: this.compress_number(public_key)};
    }

    keys()
    {
        return {private: this.private_key, public: this.public_key};
    }

    rsa_encrypt(message, public_key)
    {
        public_key = this.deflate_number(public_key);
        var seperator_position = public_key.indexOf("X");
        var e = BigInt(public_key.substring((seperator_position + 1), (public_key.length)));
        var public_key_number = BigInt(public_key.substring(0, seperator_position));
        var encrypted_message = "";
        for (var charecter_index = 0; charecter_index < message.length; charecter_index++)
        {
            encrypted_message += String(message.charCodeAt(charecter_index));
            if (charecter_index != (message.length - 1))
            {
                encrypted_message += "300";
            }
        }
        encrypted_message = String(this.mod(BigInt(encrypted_message), e, public_key_number));
        return encrypted_message;
    }

    rsa_decrypt(message, private_key)
    {
        var private_key = this.deflate_number(private_key);
        var seperator_position = private_key.indexOf("X");
        var public_key_number = BigInt(private_key.substring((seperator_position + 1), (private_key.length)));
        var private_key_number = BigInt(private_key.substring(0, seperator_position));
        var charecters = String(this.mod(BigInt(message), private_key_number, public_key_number)).split("300");
        var actual_message = "";
        for (var charecter_index = 0; charecter_index < charecters.length; charecter_index++)
        {
            actual_message += String.fromCharCode(Number(charecters[charecter_index]));
        }
        return actual_message;
    }

    encrypt(message, public_key)
    {
        var key = this.n_bits_prime(256);
        var encrypted_message = this.compress_string(message) + key;
        return (this.compress_number(String(encrypted_message)) + "K" + this.compress_number(this.rsa_encrypt(String(key), public_key)));
    }

    decrypt(message, private_key)
    {
        if (private_key == null)
        {
            private_key = this.private_key;
        }
        var seperator_position = message.indexOf("K");
        var encrypted_message = message.substring(0, seperator_position);
        var encrypted_key = this.deflate_number(message.substring((seperator_position + 1), (message.length)));
        encrypted_message = this.deflate_number(encrypted_message);
        var key = this.rsa_decrypt(encrypted_key, private_key);
        var actual_message_number = BigInt(encrypted_message) - BigInt(key);
        var actual_message = this.deflate_string(actual_message_number);
        return actual_message;
    }

}