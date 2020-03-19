# Alumni's Cup

The alumni's cup [website](http://51.68.122.149/). 



## Notes on Server Setup

1. Use [nvm](https://github.com/nvm-sh/nvm).

    ```
    $ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.2/install.sh | bash
    ```

    This avoids messing with up with pacman and allows clean version handling 
    for node.
    The node installation is however user-wise,
    each user should hence update his `.bashrc` accordingly 
    before running `nvm install node`. 
    Note that the latter also installs `npm`. 

2. Use [iptables](https://wiki.archlinux.org/index.php/Iptables)

    ```
    # iptables \
        -t nat -A PREROUTING -i eth0 -p tcp \
        --dport 80 -j REDIRECT --to-port 8080       
    ```
    
    This adds a rule redirecting requests on port 80 to port 8080.
    Save the rule to the configuration file with: 
    
    ```
    # iptables-save -f /etc/iptables/iptables.rules
    ```

    And enable `iptables.service` with `systemctl`. 

3. Use [pm2](https://pm2.keymetrics.io/) to keep the server up. 

    ```
    # ./pm2.sh
    pm2 start index.js --watch
    ``` 

    Restarts the app upon any change in the source files. 

4. Use [systemd] to start the server at boot.

    Create the unit file:

    ```
    # /etc/systemd/system/alumni.service
    [Unit]
    Description='Launch the alumniscup.org server'

    [Service]
    Type=forking
    ExecStart=/srv/http/alumni/pm2.sh
    RemainAfterExit=yes

    [Install]
    WandedBy=multi-user.target
    ```

    And `$ systemd enable alumni.service`. 

    Problem: add nvm node path with `env`, this is version dependent... 

[systemd]: https://wiki.archlinux.org/index.php/Systemd#Writing_unit_files
