exports.run = (api, event) => {
	// do some stuff

	api.sendMessage('you win! merrrr', event.thread_id);
};
