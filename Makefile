build:
	@docker build -t do-dyndns .

run:
	docker run -d -p 8002:8002 --name do-dyndns do-dyndns

clean:
	docker stop do-dyndns && docker rm do-dyndns || docker rmi do-dyndns
